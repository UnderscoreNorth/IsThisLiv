import DB from "../lib/db.js";
import { teamLink, pageExpiry, cupLink } from "../lib/helper.js";
import fs from "fs/promises";
class model {
  static login = async (req, res, next) => {
    const query = `SELECT sName as username FROM UserDB WHERE sName=? AND sHash=?`;
    const result = await DB.query(query, [
      req.body.inputUser,
      req.body.inputPass,
    ]);
    res.send(result[0]);
  };
}
export { model as default };
