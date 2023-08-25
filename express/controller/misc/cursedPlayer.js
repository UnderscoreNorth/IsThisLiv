import DB from "../../lib/db.js";
import * as h from "../../lib/helper.js";
import fs from "fs/promises";
class model {
  static main = async (req, res, next) => {
    let result = {};
    let html =
      "<h2>Cursed Players</h2>Players with at least 4 matches that have lost or drew everytime<br><br><table><tr><th>Matches</th><th>Team</th><th>Player</th></tr>";
    let sql = await DB.query(
      `SELECT sPlayer,COUNT(*) AS 'c',PlayerDB.sTeam,iLink 
      FROM PerformanceDB 
      INNER JOIN MatchDB ON PerformanceDB.iMatchID = MatchDB.iMatchID 
      INNER JOIN PlayerDB ON PlayerDB.iPlayerID = PerformanceDB.iPlayerID 
      INNER JOIN PlayerLinkDB ON PlayerLinkDB.iID = PlayerDB.iLink 
      WHERE bVoided = 1 
      GROUP BY iLink,PlayerDB.sTeam 
      HAVING SUM(CASE WHEN sWinningTeam <> PlayerDB.sTeam THEN 0 ELSE 1 END) = 0 AND COUNT(*) > 3 ORDER BY COUNT(*) DESC`
    );
    for (let i in sql) {
      let row = sql[i];
      html += `<tr>
                <td>${row.c}</td>
                <td>${h.teamLink(row.sTeam)}</td>
                <td>${await h.playerLink([row.iLink, row.sPlayer])}</td></tr>`;
    }
    html += "</table></div>";
    result.html = html;
    result.date = new Date().toLocaleString("en-us", {
      timeStyle: "short",
      dateStyle: "medium",
    });
    await fs.writeFile(req.staticUrl, JSON.stringify(result));
    res.send(result);
  };
}
export { model as default };
