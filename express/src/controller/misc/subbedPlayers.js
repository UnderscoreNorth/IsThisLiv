import DB from "../../src/lib/db.js";
import * as h from "../../src/lib/helper.js";
import fs from "fs/promises";
class model {
  static main = async (req, res, next) => {
    let result = {};
    let html = `<h2>Always Subbed</h2>
        Players with 3+ matches played that were subbed in every time.<br><br>
        <table><tr><th>Matches</th><th>Team</th><th>Player</th><th>Avg Cond</th></tr>`;
    let sql = await DB.query(
      "SELECT PlayerLinkDB.*, COUNT(*) AS 'c', AVG(iCond) AS 'cond', MIN(iSubOn) FROM PlayerLinkDB INNER JOIN PlayerDB ON PlayerLinkDB.iID = PlayerDB.iLink INNER JOIN PerformanceDB ON PlayerDB.iPlayerID = PerformanceDB.iPlayerID GROUP BY PlayerDB.iLink HAVING MIN(iSubOn) > 0 AND COUNT(*) > 2 ORDER BY COUNT(*) DESC"
    );
    for (let i in sql) {
      let row = sql[i];
      html += `<tr>
                <td>${row.c}</td>
                <td>${h.teamLink(row.sTeam)}</td>
                <td>${await h.playerLink([row.iID, row.sPlayer])}</td>
                <td>${Math.round(row.cond * 100) / 100}</td></tr>`;
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
