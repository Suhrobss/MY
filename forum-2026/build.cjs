const fs = require('node:fs');
const zlib = require('node:zlib');
const source = fs.readFileSync('forum.ts','utf8');
const assets = Object.fromEntries(fs.readdirSync('public').map(file => [
  '/'+file, zlib.deflateSync(fs.readFileSync('public/'+file)).toString('base64')
]));
fs.writeFileSync('forum.ts',source.replace(/const ASSETS=.*;/,()=> 'const ASSETS='+JSON.stringify(assets)+';'));
