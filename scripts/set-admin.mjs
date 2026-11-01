import{DatabaseSync}from'node:sqlite';
import{resolve}from'node:path';
const username=process.argv[2];if(!username||!/^[a-zA-Z0-9_]{4,24}$/.test(username)){console.error('用法：node set-admin.mjs 已注册的账号名');process.exit(1);}
const dbPath=process.env.ARENA_DATABASE||resolve(process.env.ARENA_DATA_DIR||'./data','rooms.sqlite');
const db=new DatabaseSync(dbPath);db.exec('PRAGMA busy_timeout=5000');
const a=db.prepare('SELECT id,username FROM arena_accounts WHERE username=?').get(username.toLowerCase());if(!a){console.error('未找到该账号。请先在游戏里注册，再运行此命令。');db.close();process.exit(1);}
db.prepare('INSERT OR IGNORE INTO arena_admins (account_id) VALUES (?)').run(a.id);db.close();console.log('已授予管理员权限：'+a.username+'。重新登录后，点击头像 → 管理控制台。');
