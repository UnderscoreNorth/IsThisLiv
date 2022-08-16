import mysql from 'mysql2/promise';
import config from '../config.json' assert {type:"json"};
const connection = await mysql.createConnection(config);
class DB{
    static query = async(query,params) =>{
        const [rows, fields] = await connection.execute(query, params);
        return rows;
    }
}
export {DB as default};