import {writeFile} from 'node:fs/promises';
const root=new URL('../../素材与下一版设计/星铁新增八人/',import.meta.url);
for(const id of [7,8,15,18,20,1638,2494]){
  const url='https://sg-wiki-api.hoyolab.com/hoyowiki/wapi/entry_page?entry_page_id='+id;
  const response=await fetch(url,{headers:{'x-rpc-language':'zh-cn','x-rpc-wiki_app':'hsr'},signal:AbortSignal.timeout(20000)});
  if(!response.ok){console.log(JSON.stringify({id,status:response.status}));continue;}
  const data=await response.json();
  await writeFile(new URL('skill-reference-'+id+'.json',root),JSON.stringify(data,null,2));
  console.log(JSON.stringify({id,retcode:data.retcode,message:data.message,pageName:data.data?.page?.name,keys:Object.keys(data.data||{})}));
}
