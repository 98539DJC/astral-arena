import {readFile,writeFile,mkdir,cp,readdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=p=>readFile(new URL(p,root),'utf8');
const [engine,collection,accountClient,adminClient,collectionClient,client,baseCss,collectionCss,shellCss,adminCss,characterCss,html,worker,accountWorker,adminWorker,expanded,campaign,storyClient,storyCss]=await Promise.all(['src/engine.js','src/collection.js','src/client-account.js','src/client-admin.js','src/client-collection.js','src/client.js','src/style.css','src/collection.css','src/game-shell.css','src/admin.css','src/characters.css','src/page.html','worker/index.js','worker/accounts.js','worker/admin.js','src/expanded-roster.js','src/campaign.js','src/client-story.js','src/story.css'].map(read));
const css=baseCss+'\n'+collectionCss+'\n'+shellCss+'\n'+adminCss+'\n'+characterCss+'\n'+storyCss;
const expandedSource=expanded.replace('export function createExpandedRoster','function createExpandedRoster');
const campaignSource=campaign.replace('export function createCampaign','function createCampaign');
const engineSource=engine.replace("import {createExpandedRoster} from './expanded-roster.js';",'').replace('export function createEngine','function createEngine');
const collectionSource=collection.replace('export function createCollection','function createCollection');
const app=expandedSource+'\n'+engineSource+'\n'+collectionSource+'\n'+campaignSource+'\n'+accountClient+'\n'+adminClient+'\n'+collectionClient+'\n'+storyClient+'\n'+client;
const assets={'/':{body:html,type:'text/html; charset=utf-8'},'/app.js':{body:app,type:'text/javascript; charset=utf-8'},'/style.css':{body:css,type:'text/css; charset=utf-8'},'/favicon.svg':{body:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#101827"/><path d="m32 7 7 18 18 7-18 7-7 18-7-18-18-7 18-7Z" fill="#a6edc9"/></svg>',type:'image/svg+xml'}};
for(const file of await readdir(new URL('src/art/',root)))if(/\.(png|jpg|webp)$/.test(file))assets['/art/'+file]={body:(await readFile(new URL('src/art/'+file,root))).toString('base64'),type:file.endsWith('.webp')?'image/webp':file.endsWith('.jpg')?'image/jpeg':'image/png',encoding:'base64'};
assets['/art/credits.txt']={body:await read('ASSET_CREDITS.md'),type:'text/plain; charset=utf-8'};
await mkdir(new URL('dist/server/',root),{recursive:true});
await mkdir(new URL('dist/.openai/',root),{recursive:true});
await writeFile(new URL('dist/server/index.js',root),expandedSource+'\n'+engineSource+'\n'+collectionSource+'\n'+campaignSource+'\n'+accountWorker.replace('export function createAccounts','function createAccounts')+'\n'+adminWorker.replace('export function createAdminService','function createAdminService')+'\nconst ASSETS='+JSON.stringify(assets)+';\n'+worker.replace("import {createEngine} from '../src/engine.js';",'').replace("import {createCollection} from '../src/collection.js';",'').replace("import {createAccounts} from './accounts.js';",'').replace("import {createAdminService} from './admin.js';",'').replace("import {createCampaign} from '../src/campaign.js';",''));
try{await cp(new URL('.openai/hosting.json',root),new URL('dist/.openai/hosting.json',root));}catch(error){if(error.code!=='ENOENT')throw error;}
console.log('Built self-contained game Worker with embedded assets.');
