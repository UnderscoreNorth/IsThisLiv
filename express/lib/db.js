import mysql from "mysql2/promise";
import config from "../config.json" assert { type: "json" };
let connection = await mysql.createConnection(config.sql);

class DB {
  static query = async (query, params, attempts = 0) => {
    let rows,
      fields = [];
    try {
      [rows, fields] = await connection.execute(query, params);
    } catch (err) {
      if (attempts < 3) {
        console.trace(err);
        console.log("DB reattempt " + attempts);
        connection = await mysql.createConnection(config);
        rows = await this.query(query, params, attempts + 1);
      }
    }
    return rows;
  };
}
export { DB as default };