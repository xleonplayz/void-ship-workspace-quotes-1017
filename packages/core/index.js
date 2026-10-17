export const RELEASE = 2;
export const DISCOUNT_BP = 1000;
export const catalog = Object.freeze([
 {sku:'board',name:'Birkenplatte',unitCents:1250},
 {sku:'screws',name:'Schraubenset',unitCents:450},
 {sku:'oil',name:'Holzöl',unitCents:1850}
]);
export function formatEuro(cents){return (cents/100).toFixed(2)+' EUR';}
export function quote(input){
 if(!input||!Array.isArray(input.lines)||input.lines.length<1||input.lines.length>8)throw Error('1..8 lines required');
 const seen=new Set();let subtotalCents=0;let totalQuantity=0;
 const lines=input.lines.map(line=>{
  if(!line||typeof line.sku!=='string'||!Number.isInteger(line.qty)||line.qty<1||line.qty>50)throw Error('quantity must be an integer from1 to50');
  const item=catalog.find(x=>x.sku===line.sku);if(!item)throw Error('unknown sku');
  if(seen.has(line.sku))throw Error('duplicate sku');seen.add(line.sku);
  const amountCents=item.unitCents*line.qty;subtotalCents+=amountCents;totalQuantity+=line.qty;
  return {sku:item.sku,name:item.name,qty:line.qty,unitCents:item.unitCents,amountCents};
 });
 const discountCents=totalQuantity>=10?Math.floor(subtotalCents*DISCOUNT_BP/10000):0;
 const shippingCents=490;const taxableCents=subtotalCents-discountCents+shippingCents;
 const taxCents=Math.round(taxableCents*19/100);
 return {ok:true,release:RELEASE,lines,subtotalCents,discountCents,shippingCents,taxCents,totalCents:taxableCents+taxCents,currency:'EUR'};
}
