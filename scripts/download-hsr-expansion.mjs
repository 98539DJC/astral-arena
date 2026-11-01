import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const sourceRoot=new URL('../../素材与下一版设计/星铁新增八人/',import.meta.url);
const sourcePage='https://sr.mihoyo.com/main?nav=character';
const api='https://act-api-takumi-static.mihoyo.com/content_v2_user/app/1963de8dc19e461c/getContentList?iChanId=253&iPageSize=200&iPage=1&sLangKey=zh-cn';
const rows=JSON.parse(await readFile(new URL('official-api.json',sourceRoot),'utf8')).data.list;
const targets=[
  {key:'march',name:'三月七',officialCharacterId:'1001',variant:'存护·冰原版'},
  {key:'dan',name:'丹恒',officialCharacterId:'1002',variant:'巡猎·风原版'},
  {key:'seele',name:'希儿',officialCharacterId:'1102'},
  {key:'natasha',name:'娜塔莎',officialCharacterId:'1105'},
  {key:'clara',name:'克拉拉',officialCharacterId:'1107'},
  {key:'silver',name:'银狼',officialCharacterId:'1006',variant:'虚无·量子原版'},
  {key:'ruan',name:'阮·梅',officialCharacterId:'1303'},
  {key:'firefly',name:'流萤',officialCharacterId:'1310'},
];
const jobs=[];
const characters=targets.map(target=>{
  const row=rows.find(row=>JSON.parse(row.sExt)['cha-id']===target.officialCharacterId);
  if(!row)throw Error('Official character missing: '+target.name);
  const ext=JSON.parse(row.sExt);
  const assets=[['splash','posterPC'],['portrait','poster'],['avatar','avatarPC']].map(([variant,field])=>{
    const url=ext[field]?.[0]?.url;
    if(!url||!/^https:\/\/(webstatic|fastcdn)\.mihoyo\.com\//.test(url))throw Error('Unexpected official asset: '+target.name+' '+field);
    const asset={key:target.key,name:target.name,variant,field,url,file:target.key+'-'+variant+'.png'};
    jobs.push(asset);
    return asset;
  });
  return {...target,officialName:row.sTitle,apiInfoId:row.iInfoId,sourcePage,assets};
});

let index=0;
async function worker(){
  while(index<jobs.length){
    const asset=jobs[index++];
    let bytes;
    try{bytes=await readFile(new URL(asset.file,sourceRoot));}catch{}
    if(!bytes){
      const response=await fetch(asset.url,{signal:AbortSignal.timeout(45000)});
      if(!response.ok)throw Error('Asset HTTP '+response.status+': '+asset.file);
      bytes=Buffer.from(await response.arrayBuffer());
      await writeFile(new URL(asset.file,sourceRoot),bytes);
    }
    if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Expected PNG: '+asset.file);
    asset.width=bytes.readUInt32BE(16);
    asset.height=bytes.readUInt32BE(20);
    asset.bytes=bytes.length;
    asset.sha256=createHash('sha256').update(bytes).digest('hex');
    console.log(JSON.stringify({file:asset.file,width:asset.width,height:asset.height,bytes:asset.bytes}));
  }
}
await mkdir(sourceRoot,{recursive:true});
await Promise.all(Array.from({length:4},worker));
await writeFile(new URL('素材清单.json',sourceRoot),JSON.stringify({fetchedAt:new Date().toISOString(),api,sourcePage,copyright:'miHoYo / HoYoverse. Publicly accessible official display assets; no license or official endorsement is implied.',characters},null,2));
console.log(JSON.stringify({characters:characters.length,files:jobs.length,totalBytes:jobs.reduce((sum,a)=>sum+a.bytes,0)}));
