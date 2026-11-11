const http=require('node:http');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const path=require('node:path');
process.env.DATA_DIR=fs.mkdtempSync(path.join(__dirname,'.forum-check-'));
process.env.ADMIN_PASSWORD='local-test-password';
let handler;
http.createServer=callback=>{handler=callback;return {listen(){}}};
function request(url, method='GET', headers={}, body) {
  return new Promise((resolve,reject)=>{
    const response={headers:{},setHeader(key,value){this.headers[key]=value},writeHead(status,values){this.status=status;Object.assign(this.headers,values)},end(body){resolve({status:this.status,headers:this.headers,body:String(body??'')})}};
    Promise.resolve(handler({url,method,headers:{host:'localhost',...headers},socket:{remoteAddress:'127.0.0.1'},async *[Symbol.asyncIterator](){if(body)yield Buffer.from(JSON.stringify(body));}},response)).catch(reject);
  });
}
(async()=>{
  await import('./forum.ts');
  const home=await request('/');
  assert.equal(home.status,200);
  assert.match(home.headers['Content-Security-Policy'],/frame-ancestors 'none'; frame-src https:\/\/player.vimeo.com; script-src 'self'/);
  assert.match((await request('/app.js')).body,/1175179620/);
  assert.equal(JSON.parse((await request('/api/public')).body).events.length,31);
  assert.equal(JSON.parse((await request('/api/admin/me')).body).authenticated,false);
  assert.equal((await request('/api/admin/events')).status,401);
  assert.equal((await request('/api/push/subscribe','POST',{origin:'https://example.com'})).status,403);
  const origin='http://localhost';
  const login=await request('/api/admin/login','POST',{origin},{password:process.env.ADMIN_PASSWORD});
  assert.equal(login.status,200);
  const cookie=login.headers['Set-Cookie'].split(';')[0];
  assert.equal((await request('/api/admin/state','GET',{cookie})).status,200);
  const draft=await request('/api/admin/announcements','POST',{origin,cookie},{title:'Test announcement',text:'Isolated temporary data',sendPush:false});
  assert.equal(draft.status,201);
  assert.equal(JSON.parse(draft.body).push.skipped,true);
  assert.equal(JSON.parse((await request('/api/public')).body).announcements[0].title,'Test announcement');
  console.log('Passed: admin login, isolated announcement publication, homepage, Vimeo CSP, 31 events, admin authorization, cross-origin POST.');
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>fs.rmSync(process.env.DATA_DIR,{recursive:true,force:true}));

