import { match } from "assert";
import DB from "../../src/lib/db.js";
import {
  teamLink,
  pageExpiry,
  cupLink,
  dateFormat,
  keySort,
} from "../../src/lib/helper.js";
import fs from "fs/promises";
class model {
  static main = async (req, res, next) => {
    let result = {};
    let html = "<h2>Subbing the Keeper</h2><br>";
    html +=
      "<table><tr><th>Team</th><th>Opponent</th><th colspan=2>Match</th><th>Subbed At</th><th>Result At Sub</th><th>End Result</tr>";
    let sql = await DB.query(
      "SELECT sTeam,MatchDB.*,iSubOff FROM `PerformanceDB` INNER JOIN PlayerDB ON PerformanceDB.iPlayerID = PlayerDB.iPlayerID INNER JOIN MatchDB ON PerformanceDB.iMatchID = MatchDB.iMatchID WHERE sRegPos = 'GK' AND bVoided = 1 AND iSubOff NOT IN (90,120) AND iSubOff > 0 ORDER BY dUTCTime DESC"
    );
    for (let row of Array.from(sql)) {
      const team = row.sTeam;
      const subOff = row.iSubOff;
      const oTeam = team == row.sHomeTeam ? row.sAwayTeam : row.sHomeTeam;
      let hgb = 0,
        hgt = 0,
        agb = 0,
        agt = 0;
      let sql2 = await DB.query(
        "SELECT iType,sTeam,dRegTime FROM EventDB INNER JOIN PlayerDB ON EventDB.iPlayerID = PlayerDB.iPlayerID WHERE iMatchID=? AND iType IN (1,3,4) ORDER BY dRegTime, dInjTime",
        [row.iMatchID]
      );
      for (let row2 of Array.from(sql2)) {
        if (row2.iType == 3) {
          if (row2.sTeam == team) {
            agt++;
            if (row2.dRegTime <= subOff) agb++;
          } else {
            hgt++;
            if (row2.dRegTime <= subOff) hgb++;
          }
        } else {
          if (row2.sTeam == team) {
            hgt++;
            if (row2.dRegTime <= subOff) hgb++;
          } else {
            agt++;
            if (row2.dRegTime <= subOff) agb++;
          }
        }
      }
      html += `<tr><td>${teamLink(team)}</td><td>${teamLink(
        oTeam
      )}</td><td>${dateFormat(row.dUTCTime)}</td><td>${
        row.sRound
      }</td><td>${subOff}</td><td`;
      if (hgb > agb) {
        html += " class='W'";
      } else if (hgb == agb) {
        html += " class='D'";
      } else {
        html += " class='L'";
      }
      html += `>${hgb} - ${agb}</td><td`;
      if (hgt > agt) {
        html += " class='W'";
      } else if (hgt == agt) {
        html += " class='D'";
      } else {
        html += " class='L'";
      }
      html += `>${hgt} - ${agt}</tr>`;
    }
    html += "</table>";
    result.date = new Date().toLocaleString("en-us", {
      timeStyle: "short",
      dateStyle: "medium",
    });
    html += `</div><STYLE>.rmCat{display: inline-block;
    vertical-align: top;
    margin-right: 100px;}</STYLE>`;
    result.html = html;
    await fs.writeFile(req.staticUrl, JSON.stringify(result));
    res.send(result);
  };
}

export { model as default };
