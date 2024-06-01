import DB from "../../src/lib/db.js";
import * as h from "../../src/lib/helper.js";
import fs from "fs/promises";
class model {
  static main = async (req, res, next) => {
    let result = {};
    let html =
      "<h2>Blessed Players</h2>Players with at least 4 matches and have not lost 80% of the time<br><br><table><tr><th>Matches</th><th>Win/Draw</th><th>Losses</th><th>Team</th><th>Player</th></tr>";
    let sql = await DB.query(
      "SELECT sPlayer ,COUNT(*) AS 'c' , SUM(CASE WHEN sWinningTeam = PlayerDB.sTeam OR sWinningTeam = 'draw' THEN 1 ELSE 0 END) AS 'WD' , SUM(CASE WHEN sWinningTeam <> 'draw' AND sWinningTeam <> PlayerDB.sTeam THEN 1 ELSE 0 END) AS 'L' ,iLink,PlayerDB.sTeam FROM PerformanceDB INNER JOIN MatchDB ON PerformanceDB.iMatchID = MatchDB.iMatchID INNER JOIN PlayerDB ON PlayerDB.iPlayerID = PerformanceDB.iPlayerID INNER JOIN PlayerLinkDB ON PlayerLinkDB.iID = PlayerDB.iLink WHERE bVoided = 1 GROUP BY iLink,PlayerDB.sTeam HAVING COUNT(*) > 3 AND WD/(WD + L) >= 0.8 ORDER BY L, WD DESC"
    );
    for (let i in sql) {
      let row = sql[i];
      html += `<tr>
            <td>${row.c}</td>
            <td>${row.WD}</td>
            <td>${row.L}</td>
            <td>${h.teamLink(row.sTeam)}</td>
            <td>${await h.playerLink([row.iLink, row.sPlayer])}</td>
            </tr>`;
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
