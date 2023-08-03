import DB from "../lib/db.js";
import { teamLink, pageExpiry, cupLink } from "../lib/helper.js";
import fs from "fs/promises";
class model {
  static cups = async (req, res, next) => {
    const order = req.body.order ? "ORDER BY " + req.body.order : "";
    const dir = req.body.dir ?? "";
    const query = `SELECT * FROM CupDB ${order} ${dir}`;
    const result = await DB.query(query);
    res.send(result);
  };
  static teams = async (req, res, next) => {
    const cupID =
      req.body.cupID ??
      (await DB.query(
        `SELECT iID FROM CupDB WHERE iType <= 2 ORDER BY dStart DESC LIMIT 1`
      ).then((result) => {
        return result[0].iID;
      }));
    let where = "";
    if (req.body.aliveTeams) {
      await DB.query(
        `SELECT COUNT(*) AS c FROM MatchDB WHERE sRound = 'Round of 16' AND iCupID=${cupID}`
      ).then((result) => {
        if (result[0].c > 0) where = ` AND sRound='Round of 16'`;
      });
    }
    const order = req.body.order ? "ORDER BY " + req.body.order : "";
    const dir = req.body.dir ?? "";
    const query = `
    SELECT sTeam FROM (
      SELECT sHomeTeam AS sTeam FROM MatchDB WHERE iCupID=${cupID}${where}
      UNION
      SELECT sAwayTeam AS sTeam FROM MatchDB WHERE iCupID=${cupID}${where}) t
    GROUP BY sTeam ${order} ${dir}`;
    const result = await DB.query(query);
    res.send(result);
  };
}
export { model as default };
