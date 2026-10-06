import {seedReplies} from './lebanese.mjs';
// Fictional business dataset, not Chahos prices or a real client's policy.
export const documents = [
  {id:'membership', title:'Cedar Gym · Membership', updated:'2026-10-06', text:'Cedar Gym is a fictional gym in Tripoli, Lebanon. Gym membership costs $35 per month. اشتراك الجيم 35 دولار بالشهر. Membership includes weights and cardio. Personal training is quoted separately. اشتراك gym membership price se3er eshterak'},
  {id:'boxing', title:'Cedar Gym · Boxing', updated:'2026-10-06', text:'Boxing classes cost $35 per month, separate from gym membership. Classes are Tuesday and Thursday at 5:00 pm and Saturday at 10:00 am, Asia/Beirut time. بوكسينغ ملاكمة الثلاثاء والخميس الساعة 5 والسبت الساعة 10. boxing boxe بوكسينج'},
  {id:'trial', title:'Cedar Gym · Trial appointments', updated:'2026-10-06', text:'A free 30-minute introductory visit can be requested. Trial appointments require customer confirmation. Booking slots displayed in this demo are fictional and are not a live calendar. زيارة تجريبية موعد مجاني حجز trial appointment booking'},
  {id:'cancellation', title:'Cedar Gym · Cancellation policy', updated:'2026-10-06', text:'Cancel a trial appointment at least 12 hours before the appointment. Refund eligibility for paid memberships must be checked with a human manager; the assistant cannot approve refunds. إلغاء الموعد قبل 12 ساعة. استرجاع الأموال عبر الإدارة. cancellation cancel refund'},
  {id:'contact', title:'Cedar Gym · Contact & handoff', updated:'2026-10-06', text:'Cedar Gym is a fictional demonstration business in Tripoli, Lebanon. Ask a human member of staff for medical advice, accessibility needs, exceptional discounts or complaints. No real contact number is supplied in this demo. طرابلس لبنان location address وين الموقع'},
];
for(const doc of documents){doc.replies=seedReplies[doc.id];if(doc.id==='boxing')doc.keywords=['schedule'];}
export const datasetVersion = 'cedar-demo-v2-lb';
