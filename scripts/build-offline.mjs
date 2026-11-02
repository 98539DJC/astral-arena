import{readFile,writeFile,readdir,mkdir}from'node:fs/promises';
import worker from '../dist/server/index.js';
const root=new URL('../',import.meta.url),images={};
for(const name of await readdir(new URL('src/art/',root))){
 if(!/\.(webp|png|jpg)$/.test(name))continue;
 const mime=name.endsWith('jpg')?'image/jpeg':name.endsWith('png')?'image/png':'image/webp';
 images[name]='data:'+mime+';base64,'+(await readFile(new URL('src/art/'+name,root))).toString('base64');
}
const response=async path=>(await worker.fetch(new Request('https://offline.example'+path),{})).text();
let [html,css,app]=await Promise.all([response('/'),response('/style.css'),response('/app.js')]);
for(const[name,uri]of Object.entries(images))css=css.replaceAll('/art/'+name,uri);
const portraits=Object.fromEntries(Object.entries(images).filter(([name])=>name.endsWith('.webp')).map(([name,uri])=>[name.replace(/\.webp$/,''),uri]));
html=html.replace('<link rel="stylesheet" href="/style.css">','<style>'+css+'</style>').replace('<link rel="icon" href="/favicon.svg" type="image/svg+xml">','').replace('<script type="module" src="/app.js"></script>','<script>globalThis.ASTRAL_PORTRAITS='+JSON.stringify(portraits)+';\n'+app.replace(/<\/script/gi,'<\\/script')+'</script>');
await mkdir(new URL('dist/',root),{recursive:true});await writeFile(new URL('dist/offline.html',root),html);
console.log('Built self-contained offline game with combat effects.');
