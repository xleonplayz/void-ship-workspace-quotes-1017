import http from 'node:http';
import {RELEASE,catalog,formatEuro} from '@harbor/quote-core';
const options=catalog.map(p=>'<option value="'+p.sku+'">'+p.name+' · '+formatEuro(p.unitCents)+'</option>').join('');
const html=`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Harbor Angebotsdesk</title><style>
body{margin:0;background:#eef0e9;color:#172f31;font:17px system-ui}main{max-width:1040px;margin:50px auto;padding:24px}header{border-bottom:2px solid #172f31;display:flex;justify-content:space-between;gap:20px;align-items:center}h1{font-size:42px;margin:12px 0}small{letter-spacing:.15em}section{background:white;padding:24px;margin:20px 0;border:1px solid #d8ded1;border-radius:10px}button,input,select{font:inherit;padding:11px;border:1px solid #91a49d;border-radius:5px}button{background:#244a42;color:white;cursor:pointer}button.secondary{background:white;color:#244a42}label{display:block;font-size:14px;margin-bottom:6px}.line{display:grid;grid-template-columns:1fr 130px 70px;gap:12px;margin:12px 0}table{width:100%;border-collapse:collapse}td,th{padding:12px;border-bottom:1px solid #dde1d7;text-align:left}td:last-child,th:last-child{text-align:right}#total{font-size:34px;font-weight:700}#message{min-height:24px}#result[hidden]{display:none}footer{font-size:13px;color:#52665d}@media(max-width:600px){main{margin:12px auto}h1{font-size:30px}.line{grid-template-columns:1fr 90px 50px}select{min-width:0;width:100%}}
</style></head><body><main><header><div><small>HARBOR / ANGEBOTE</small><h1>Material sauber kalkuliert.</h1></div><span id="release">Release ${RELEASE}</span></header>
<p>Material auswählen, Mengen eintragen und ein Angebot berechnen.</p>
<section><button id="login">Demo anmelden</button> <button id="logout" class="secondary">Abmelden</button><p id="message" role="status">Bitte anmelden.</p></section>
<section><form id="quote-form"><label>Artikel und Menge</label><div id="lines"><div class="line"><select class="sku">${options}</select><input class="qty" type="number" min="1" max="50" value="2" required><button type="button" class="remove secondary" aria-label="Zeile entfernen">×</button></div></div><button id="add" type="button" class="secondary">Artikel ergänzen</button> <button id="calculate">Angebot berechnen</button></form></section>
<section id="result" hidden><h2>Ihr Angebot</h2><table><thead><tr><th>Artikel</th><th>Menge</th><th>Betrag</th></tr></thead><tbody id="quote-lines"></tbody></table><dl id="breakdown"></dl><p id="total"></p><button id="export" class="secondary">CSV herunterladen</button></section>
<footer>Synthetische Demo ohne Bestellung oder Zahlung. Demo-Anmeldung ist kein Schutz für echte Daten. Versand 4,90 EUR; fester Demo-Steuersatz 19 %. Keine Speicherung von Angeboten.</footer><script src="/app.js"></script></main></body></html>`;
const js=String.raw`const msg=document.querySelector('#message');let latest=null;
const euro=c=>(c/100).toFixed(2)+' EUR';
const row=()=>document.querySelector('.line');
document.querySelector('#add').onclick=()=>{if(document.querySelectorAll('.line').length>=8)return;const copy=row().cloneNode(true);copy.querySelector('.qty').value=1;document.querySelector('#lines').append(copy);};
document.querySelector('#lines').onclick=e=>{if(e.target.closest('.remove')&&document.querySelectorAll('.line').length>1)e.target.closest('.line').remove();};
document.querySelector('#login').onclick=async()=>{const r=await fetch('/login',{method:'POST'});msg.textContent=r.ok?'Angemeldet.':'Anmeldung fehlgeschlagen.';};
document.querySelector('#logout').onclick=async()=>{await fetch('/logout',{method:'POST'});latest=null;document.querySelector('#result').hidden=true;msg.textContent='Abgemeldet.';};
document.querySelector('#quote-form').onsubmit=async e=>{e.preventDefault();msg.textContent='Berechnung läuft…';try{
const lines=[...document.querySelectorAll('.line')].map(r=>({sku:r.querySelector('.sku').value,qty:Number(r.querySelector('.qty').value)}));
const r=await fetch('/api/quote',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lines})});const d=await r.json();if(!r.ok)throw Error(d.error||('HTTP '+r.status));latest=d;
const table=document.querySelector('#quote-lines');table.replaceChildren();for(const l of d.lines){const tr=document.createElement('tr');for(const value of [l.name,l.qty,euro(l.amountCents)]){const td=document.createElement('td');td.textContent=value;tr.append(td);}table.append(tr);}
const dl=document.querySelector('#breakdown');dl.replaceChildren();for(const [name,value] of [['Material',d.subtotalCents],['Mengenrabatt',-d.discountCents],['Versand',d.shippingCents],['Steuer',d.taxCents]]){const dt=document.createElement('dt');dt.textContent=name;const dd=document.createElement('dd');dd.textContent=euro(value);dl.append(dt,dd);}
document.querySelector('#total').textContent=euro(d.totalCents);document.querySelector('#result').hidden=false;msg.textContent='Berechnet · Release '+d.release;
}catch(error){document.querySelector('#result').hidden=true;msg.textContent='Fehler: '+error.message;}};
document.querySelector('#export').onclick=()=>{if(!latest)return;const csv='sku,quantity,amount_cents\n'+latest.lines.map(l=>[l.sku,l.qty,l.amountCents].join(',')).join('\n')+'\ntotal,,'+latest.totalCents+'\n';const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='harbor-quote.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};`;
http.createServer(async(req,res)=>{
 const path=(req.url||'/').split('?')[0];console.info('workspace-desk',req.method,path,'release',RELEASE);
 const send=(status,value,headers={})=>{res.writeHead(status,{'content-type':'application/json',...headers});res.end(JSON.stringify(value));};
 if(path==='/'){res.writeHead(200,{'content-type':'text/html;charset=utf-8'});res.end(html);return;}
 if(path==='/app.js'){res.writeHead(200,{'content-type':'application/javascript;charset=utf-8'});res.end(js);return;}
 if(path==='/health'){send(200,{ok:true,service:'workspace-desk',release:RELEASE});return;}
 if(path==='/login'&&req.method==='POST'){send(200,{ok:true},{'set-cookie':'harbor_quote_demo=member; HttpOnly; Path=/; SameSite=Lax'});return;}
 if(path==='/logout'&&req.method==='POST'){send(200,{ok:true},{'set-cookie':'harbor_quote_demo=; Max-Age=0; HttpOnly; Path=/; SameSite=Lax'});return;}
 if(path==='/api/quote'&&req.method==='POST'){
  if(!(req.headers.cookie||'').split(';').some(x=>x.trim()==='harbor_quote_demo=member')){send(401,{error:'login required'});return;}
  if(!process.env.QUOTE_URL){send(503,{error:'quote service not configured'});return;}
  try{let body='';for await(const chunk of req)body+=chunk;if(body.length>4096){send(413,{error:'body too large'});return;}
   const upstream=await fetch(process.env.QUOTE_URL+'/quote',{method:'POST',headers:{'content-type':'application/json'},body,signal:AbortSignal.timeout(12000)});
   const text=await upstream.text();res.writeHead(upstream.status,{'content-type':'application/json','x-harbor-hop':'desk-to-quote'});res.end(text);
  }catch(error){send(502,{error:'quote service unavailable',detail:String(error)});}return;
 }
 send(404,{error:'not found'});
}).listen(Number(process.env.PORT||3270),'0.0.0.0');
