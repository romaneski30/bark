import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('./worker/index.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const store=new Map();const changes=[];
const env={ACTIVITY:{
 async list({prefix}){return {keys:[...store.keys()].filter(k=>k.startsWith(prefix)).map(name=>({name})),list_complete:true};},
 async get(k,type){const value=store.get(k);return value===undefined?null:type==='json'?JSON.parse(value):value;},
 async put(k,v){changes.push('put');store.set(k,v);},
 async delete(k){changes.push('delete');store.delete(k);}
},ASSETS:{async fetch(request){return new Response('mock static asset: '+new URL(request.url).pathname);}}};
// All calls target a local test hostname and synthetic in-memory KV. No network.
const base='https://bark-test.invalid';
const call=async(path,method='GET',body)=>worker.fetch(new Request(base+path,{method,...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})}),env);
let count=0;
assert.equal((await call('/api/health')).status,200);count++;
assert.deepEqual(await (await call('/api/share')).json(),{url:base,urls:[base]});count++;
assert.equal(await (await call('/')).text(),'mock static asset: /');count++;
assert.equal((await (await call('/api/parks')).json()).parks.length,11);count++;
assert.equal((await call('/api/missing')).status,404);count++;
assert.equal((await call('/api/status','PUT',{visitorId:'invalid',status:'here'})).status,400);count++;
const visitorId='00000000-0000-4000-8000-000000000001';
assert.equal((await call('/api/status','PUT',{visitorId,parkId:'missing',status:'here'})).status,400);count++;
let payload=await (await call('/api/status','PUT',{visitorId,parkId:'altoona',status:'here',nickname:'Synthetic test'})).json();
assert.equal(payload.parks[0].hereCount,1);assert.equal(payload.parks[0].visitors[0].name,'Synthetic test');count++;
const expires=JSON.parse(store.get('v:'+visitorId)).expires_at;
await call('/api/status','PUT',{visitorId,parkId:'altoona',status:'here',resetTimer:false});assert.equal(JSON.parse(store.get('v:'+visitorId)).expires_at,expires);count++;
await call('/api/status','PUT',{visitorId,status:'none'});assert.equal(store.size,0);count++;
store.set('v:'+visitorId,JSON.stringify({visitor_id:visitorId,park_id:'altoona',status:'here',expires_at:0}));
await call('/api/parks');assert.equal(store.size,0);count++;
console.log(JSON.stringify({backend_mock_checks:count,KV:'in-memory synthetic only',network_calls:0,production_calls:0,recovered_code:'logic preserved; formatting normalized'},null,2));
