import DB from "../../lib/db.js";
import * as h from "../../lib/helper.js";
import fs from "fs/promises";
class model {
  static main = async (req, res, next) => {
    let result = {};
    let html = `<h2>4.5 Medal Performances</h2>
        <table><tr><th>Team</th><th>Player</th><th>Pos</th><th>Medal</th><th colspan=2 >Match</th></tr>`;
    let sql = await DB.query(
      "SELECT PlayerDB.iPlayerID,PlayerDB.sName,sTeam,sHomeTeam,sRegPos,sMedal,sAwayTeam,sRound FROM PerformanceDB INNER JOIN PlayerDB ON PerformanceDB.iPlayerID = PlayerDB.iPlayerID INNER JOIN MatchDB ON MatchDB.iMatchID = PerformanceDB.iMatchID INNER JOIN CupDB ON CupDB.iCupID = MatchDB.iCupID WHERE sMedal <> '' AND dRating > 0 AND dRating < 5 AND bVoided = 1 ORDER BY dRating,dUTCTime DESC"
    );
    for (let i in sql) {
      let row = sql[i];
      html += `<tr>
                <td>${await h.playerLink([row.iPlayerID, row.sName])}</td>
                <td>${h.teamLink(row.sTeam)}</td>
                <td>${row.sRegPos}</td>
                <td>${row.sMedal}</td>
                <td>${h.teamLink(row.sHomeTeam)} - ${h.teamLink(
        row.sAwayTeam
      )}</td>
                <td>${row.sRound}</td>
                </tr>`;
    }
    html += "</table>";
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
