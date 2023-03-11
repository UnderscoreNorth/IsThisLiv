import DB from "../../lib/db.js";
import { teamLink, pageExpiry, cupLink, keySort } from "../../lib/helper.js";
import fs from "fs/promises";
class model {
  static main = async (req, res, next) => {
    let result = {};
    let html = `<h2>Last Elite Knockout Appearance</h2>
        <table><tr><th>Board</th><th>Last Elite Knockout Appearance</th></tr>`;
    let sql = await DB.query(
      "SELECT DISTINCT(sHomeTeam) FROM MatchDB WHERE bVoided = 1 ORDER BY sHomeTeam"
    );
    let arr = [];
    for (let row of Array.from(sql)) {
      let team = row.sHomeTeam;
      let last = await DB.query(
        "SELECT * FROM `MatchDB` INNER JOIN CupDB On MatchDB.iCupID = CupDB.iID WHERE iType = 1 AND (sRound = 'Round of 16' OR sRound = 'Round of 32') AND (sHomeTeam = ? OR sAwayTeam = ?) AND bVoided = 1 ORDER BY dUTCTime DESC",
        [team, team]
      ).then((result) => {
        let r = result[0];
        return r?.sName ? { team, cup: r.sName, date: r.dUTCTime } : "";
      });
      if (last) arr.push(last);
    }
    arr = keySort(arr, "date", true);
    for (let row of arr) {
      html += `<tr><td>${teamLink(row.team)}</td><td>${row.cup}</td></tr>`;
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
