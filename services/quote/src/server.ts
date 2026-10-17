import http from 'node:http';
import {RELEASE,quote} from '@harbor/quote-core';
type QuoteInput = { lines: { sku: string; qty: number }[] };
http.createServer(async(req,res)=>{
 const path=(req.url||'/').split('?')[0];let status=200;let result:unknown;
 if(path==='/health')result={ok:true,service:'workspace-quote',release:RELEASE};
 else if(path==='/quote'&&req.method==='POST'){
  let body='';for await(const chunk of req)body+=chunk;
  if(body.length>4096){status=413;result={error:'body too large'};}
  else {let input:QuoteInput|undefined;
   try{input=JSON.parse(body);}catch{status=400;result={error:'invalid JSON'};}
   if(status===200){try{result=quote(input);}catch(error){status=422;result={error:String(error)};}}
  }
 }else{status=404;result={error:'not found'};}
 console.info('workspace-quote',req.method,path,status,'release',RELEASE);
 res.writeHead(status,{'content-type':'application/json','x-quote-release':String(RELEASE)});res.end(JSON.stringify(result));
}).listen(Number(process.env.PORT||8271),'0.0.0.0');
