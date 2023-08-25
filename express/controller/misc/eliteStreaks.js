import { match } from "assert";
import DB from "../../lib/db.js";
import {
  teamLink,
  pageExpiry,
  cupLink,
  dateFormat,
  keySort,
} from "../../lib/helper.js";
import fs from "fs/promises";
class model {
  static main = async (req, res, next) => {
    let result = {};
    let html = `<h2>Consecutive Elite Cup Appearances</h2>
    Every streak (4+) of Elite Cup Appearances
    <table><tr><th>Without Babbies In Between</th><th>With Babbies In Between</th></tr><tr><td style='vertical-align:top'>
    <table><tr><th>#</th><th>Board</th><th>Start</th><th>End</th>`;
    let sql = await DB.query(`SELECT * FROM (
        SELECT sHomeTeam AS 'team',iType,sName,dStart FROM MatchDB INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iCupID WHERE bVoided = 1 AND iType <= 3 GROUP BY sHomeTeam,CupDB.iCupID
        UNION
        SELECT sAwayTeam AS 'team',iType,sName,dStart FROM MatchDB INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iCupID WHERE bVoided =1 AND iType <= 3 GROUP BY sAwayTeam,CupDB.iCupID) AS t 
        ORDER BY team,dStart`);

    let t = "";
    let withoutCount = 0;
    let s = 0;
    let f = 0;
    let type = "";
    let withoutBabby = [];
    let withBabby = [];
    for (let row of Array.from(sql)) {
      if (t !== row.team || row.iType > 1) {
        if (withoutCount > 3) {
          if (t !== row.team && type == 1) {
            if (t == row.team) {
              withoutBabby.push({
                num: withoutCount,
                team: t,
                start: s,
                finish: f,
              });
            } else {
              withoutBabby.push({
                num: withoutCount,
                team: t,
                start: s,
                finish: "Ongoing",
              });
            }
          } else {
            withoutBabby.push({
              num: withoutCount,
              team: t,
              start: s,
              finish: f,
            });
          }
        }
        t = row.team;
        withoutCount = 0;
      }
      if (row.iType == 1) {
        if (!withoutCount) s = row.sName;
        withoutCount++;
      }
      f = row.sName;
      type = row.iType;
    }
    if (withoutCount > 3) {
      withoutBabby.push({ num: withoutCount, team: t, start: s, finish: f });
    }
    t = "";
    withoutCount = 0;
    let withCount = 0;
    s = 0;
    f = 0;
    type = "";
    for (let row of Array.from(sql)) {
      if (row.iType > 1) withCount++;
      if (t !== row.team || withCount > 1) {
        if (withoutCount > 3) {
          if (t !== row.team && type == 1) {
            if (t == row.team) {
              withBabby.push({
                num: withoutCount,
                team: t,
                start: s,
                finish: f,
              });
            } else {
              withBabby.push({
                num: withoutCount,
                team: t,
                start: s,
                finish: "Ongoing",
              });
            }
          } else {
            withBabby.push({
              num: withoutCount,
              team: t,
              start: s,
              finish: f,
            });
          }
        }
        t = row.team;
        withoutCount = 0;
        withCount = 0;
      }
      if (row.iType == 1) {
        if (!withoutCount) s = row.sName;
        withoutCount++;
        withCount = 0;
        f = row.sName;
      }

      type = row.iType;
    }
    if (withoutCount > 3) {
      withBabby.push({ num: withoutCount, team: t, start: s, finish: f });
    }
    withoutBabby = keySort(withoutBabby, "num", true);
    for (let row of withoutBabby) {
      html += `<tr><td>${row.num}</td><td>${teamLink(row.team)}</td><td>${
        row.start
      }</td><td>${row.finish}</td></tr>`;
    }
    html +=
      "</table></td><td><table><tr><th>#</th><th>Board</th><th>Start</th><th>End</th>";
    withBabby = keySort(withBabby, "num", true);
    for (let row of withBabby) {
      html += `<tr><td>${row.num}</td><td>${teamLink(row.team)}</td><td>${
        row.start
      }</td><td>${row.finish}</td></tr>`;
    }
    html += "</table></td></tr></table>";

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
