import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {bookingPlan,availableSlots} from '../../public/ai-lab/core.mjs';
export class Store {
  constructor(path=':memory:'){
    this.db=new DatabaseSync(path);
    this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS plans(id TEXT PRIMARY KEY,payload TEXT NOT NULL,expires INTEGER NOT NULL,confirmed INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS bookings(id TEXT PRIMARY KEY,plan_id TEXT UNIQUE NOT NULL,slot TEXT UNIQUE NOT NULL,payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS outbox(id TEXT PRIMARY KEY,booking_id TEXT UNIQUE NOT NULL,payload TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'draft');
      CREATE TABLE IF NOT EXISTS traces(id TEXT PRIMARY KEY,payload TEXT NOT NULL,created INTEGER NOT NULL);`);
  }
  plan(lead,slot,now=new Date()){
    const plan={...bookingPlan(lead,slot,availableSlots(now)),id:randomUUID()};
    if(this.db.prepare('SELECT id FROM bookings WHERE slot=?').get(slot))throw new Error('That slot is already booked.');
    this.db.prepare('DELETE FROM plans WHERE expires < ? AND confirmed=0').run(Date.now());
    this.db.prepare('INSERT INTO plans(id,payload,expires) VALUES(?,?,?)').run(plan.id,JSON.stringify(plan),Date.now()+10*60*1000);
    return plan;
  }
  confirm(planId,confirmed){
    if(confirmed!==true)throw new Error('Explicit confirmation is required.');
    this.db.exec('BEGIN IMMEDIATE');
    try{
      const row=this.db.prepare('SELECT * FROM plans WHERE id=?').get(planId);
      if(!row)throw new Error('Unknown approval plan.');
      // Idempotent replay returns the same record and never duplicates an action.
      if(row.confirmed){const saved=this.db.prepare('SELECT payload FROM bookings WHERE plan_id=?').get(planId);this.db.exec('COMMIT');return JSON.parse(saved.payload);}
      if(row.expires<Date.now())throw new Error('Approval plan expired. Please review a new plan.');
      const plan=JSON.parse(row.payload);
      if(new Date(plan.slot)<=new Date())throw new Error('Appointment is in the past.');
      const result={...plan,id:randomUUID(),status:'confirmed'};
      this.db.prepare('INSERT INTO bookings VALUES(?,?,?,?)').run(result.id,planId,plan.slot,JSON.stringify(result));
      if(plan.lead.followUp)this.db.prepare('INSERT INTO outbox(id,booking_id,payload) VALUES(?,?,?)').run(randomUUID(),result.id,JSON.stringify({event:'booking.confirmed',bookingId:result.id,recipient:plan.lead.email,consent:true,text:'Your demo trial request has been confirmed.',delivery:'manual-review-required'}));
      this.db.prepare('UPDATE plans SET confirmed=1 WHERE id=?').run(planId);this.db.exec('COMMIT');return result;
    }catch(err){this.db.exec('ROLLBACK');if(String(err.message).includes('UNIQUE'))throw new Error('That slot was just booked. Choose another.');throw err;}
  }
  records(){return this.db.prepare('SELECT payload FROM bookings ORDER BY rowid DESC LIMIT 100').all().map(x=>JSON.parse(x.payload));}
  outbox(){return this.db.prepare('SELECT payload,status FROM outbox ORDER BY rowid DESC LIMIT 100').all().map(x=>({...JSON.parse(x.payload),status:x.status}));}
  trace(t){this.db.prepare('INSERT INTO traces VALUES(?,?,?)').run(t.id,JSON.stringify(t),Date.now());this.db.exec('DELETE FROM traces WHERE id NOT IN (SELECT id FROM traces ORDER BY created DESC LIMIT 500)');}
  traces(){return this.db.prepare('SELECT payload FROM traces ORDER BY created').all().map(x=>JSON.parse(x.payload));}
  close(){this.db.close();}
}
