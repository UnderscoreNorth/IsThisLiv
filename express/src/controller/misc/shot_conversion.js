import DB from "../../src/lib/db.js";
import * as h from "../../src/lib/helper.js";
import fs from "fs/promises";
export default async function (req, res, next) {
  let result = {};
  let html = `<h2>100% Shot Conversion</h2>
    Minimum 2 shots/goals<br><table><tr><th>Team</th><th>Shots/Goals</th><th colspan=2>Match</th></tr>`;
  let sql = await DB.query(
    `SELECT 
            PlayerDB.sTeam
            ,COUNT(*) AS 'c'
            ,FLOOR(AVG(iShots))
            ,MatchDB.*
            ,CupDB.sName
        FROM 
            EventDB 
        INNER JOIN 
            PlayerDB ON PlayerDB.iPlayerID = EventDB.iPlayerID 
        INNER JOIN 
            MatchStatDB ON MatchStatDB.iMatchID = EventDB.iMatchID AND MatchStatDB.sTeam = PlayerDB.sTeam 
        INNER JOIN
            MatchDB ON MatchDB.iMatchID = EventDB.iMatchID
        INNER JOIN 
            CupDB ON MatchDB.iCupID = CupDB.iCupID
        WHERE 
            EventDB.iType IN (1,4) AND bFinal = 1  AND bVoided = 1
        GROUP BY 
            PlayerDB.sTeam,EventDB.iMatchID 
        HAVING 
            COUNT(*) = AVG(iShots) AND COUNT(*) >= 2
        ORDER BY 
            dUTCTime DESC`
  );
  for (let i in sql) {
    let row = sql[i];
    html += `<tr>
                <td>${h.teamLink(row.sTeam)}</td>
                <td>${row.c}</td>
                <td>${h.teamLink(row.sHomeTeam)} - ${h.teamLink(
      row.sAwayTeam
    )}</td>
                <td>${row.sName + " " + row.sRound}</td>
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
}
