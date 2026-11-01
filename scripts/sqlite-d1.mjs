// The standalone server uses the same prepared-statement and atomic-batch contract as D1.
export function createD1(database){
  function statement(sql,values=[]){return{sql,values,bind(...args){return statement(sql,args);},first:async()=>database.prepare(sql).get(...values)??null,run:async()=>({meta:{changes:database.prepare(sql).run(...values).changes}})};}
  return{prepare:statement,async batch(statements){database.exec('BEGIN IMMEDIATE');try{const results=statements.map(s=>({meta:{changes:database.prepare(s.sql).run(...s.values).changes}}));database.exec('COMMIT');return results;}catch(e){database.exec('ROLLBACK');throw e;}}};
}
