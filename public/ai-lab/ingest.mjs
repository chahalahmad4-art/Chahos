import {checkInput} from './core.mjs';
export const limits={files:5,fileBytes:32768,totalBytes:98304,chunks:180};
const bytes=s=>new TextEncoder().encode(s).length;
export async function ingestDocuments(files){
  if(!Array.isArray(files)||!files.length||files.length>limits.files)throw new Error('Choose between 1 and 5 TXT or Markdown files.');
  let total=0;const normalized=[];
  for(const f of files){
    if(!f||typeof f.name!=='string'||typeof f.text!=='string'||!/^.{1,100}\.(txt|md)$/i.test(f.name)||/[\/\\\x00-\x1f]/.test(f.name))throw new Error('Use plain .txt or .md files with simple filenames.');
    const text=f.text.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').trim();
    if(!text||text.includes('\0')||text.includes('\uFFFD'))throw new Error('Files must contain valid UTF-8 text.');
    const size=bytes(text);if(size>limits.fileBytes)throw new Error('Each file must be 32 KiB or smaller.');total+=size;
    if(total>limits.totalBytes)throw new Error('The combined library must be 96 KiB or smaller.');
    if(normalized.some(n=>n.name===f.name))throw new Error('Filenames must be unique.');normalized.push({name:f.name,text});
  }
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(normalized)));
  const version='custom-'+[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,16);
  const documents=[],quarantined=[],updated=new Date().toISOString().slice(0,10);
  for(const [fileIndex,f] of normalized.entries()){
    // Character-bounded windows keep long tokens from defeating size limits.
    for(let start=0,part=1;start<f.text.length;part++){
      let end=Math.min(start+900,f.text.length);
      if(end<f.text.length){const boundary=f.text.lastIndexOf(' ',end);if(boundary>start+650)end=boundary;}
      const text=f.text.slice(start,end).trim();
      const chunk={id:`doc-${fileIndex+1}-chunk-${part}`,title:f.name+' · passage '+part,text,updated,version,filename:f.name};
      if(checkInput(text).reason==='injection')quarantined.push({...chunk,reason:'Instruction-like content requires review'});else documents.push(chunk);
      if(documents.length+quarantined.length>limits.chunks)throw new Error('Too many passages. Use a smaller library.');
      if(end===f.text.length)break;start=end-100;
    }
  }
  return {version,documents,quarantined,files:normalized.map(f=>({name:f.name,bytes:bytes(f.text)})),bytes:total};
}
