import { match } from "assert";
import DB from "../../lib/db.js";
import { teamLink, pageExpiry, cupLink, dateFormat } from "../../lib/helper.js";
import fs from "fs/promises";
class model {
  static main = async (req, res, next) => {
    let result = {};

    let html = "<h2>Sub On Man of the Match</h2>";
    html +=
      "<table><tr><th>Player</th><th>Pos</th><th>Sub On</th><th>Rating</th><th colspan=2>Match</th></tr>";
    let sql = await DB.query(
      "SELECT *,PlayerDB.sName AS 'name',CupDB.sName AS 'cname' FROM PerformanceDB INNER JOIN PlayerDB ON PerformanceDB.iPlayerID = PlayerDB.iID INNER JOIN MatchDB ON MatchDB.iID = PerformanceDB.iMatchID INNER JOIN CupDB ON CupDB.iID = MatchDB.iCupID WHERE bMotM = 1 AND iSubOn > 0 ORDER BY dUTCTime DESC"
    );
    for (let row of Array.from(sql)) {
      html += `<tr><td>${row.name}</td><td>${row.sRegPos}</td><td>${
        row.iSubOn
      }</td><td>${row.dRating > 0 ? row.dRating : "?"}</td><td>${teamLink(
        row.sHomeTeam
      )} - ${teamLink(row.sAwayTeam)}</td><td>${row.cname} ${
        row.sRound
      }</td></tr>`;
    }
    html += "</table>";
    result.date = new Date().toLocaleString("en-us", {
      timeStyle: "short",
      dateStyle: "medium",
    });
    result.html = html;
    await fs.writeFile(req.staticUrl, JSON.stringify(result));
    res.send(result);
  };
}

export { model as default };
