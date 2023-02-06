import DB from "../lib/db.js";
import * as h from "../lib/helper.js";
import fs from "fs/promises";
class model {
  static main = async (req, res, next) => {
    let stats = await fs.stat(req.staticUrl).catch((err) => {
      return { mtime: new Date("01/01/2000") };
    });
    let result = [];
    console.log(req.staticUrl);
    if (new Date() - stats.mtime > h.pageExpiry) {
      let teams = await DB.query(
        "SELECT DISTINCT(sHomeTeam) FROM MatchDB WHERE bVoided = 1 ORDER BY sHomeTeam",
        ""
      );
      let wikiText = ``;

      for (let i in teams) {
        let team = teams[i].sHomeTeam;
        let stats = await DB.query(
          `SELECT SUM(CASE WHEN sWinningTeam = '${team}' THEN 1 ELSE 0 END) AS 'w',SUM(CASE WHEN sWinningTeam = 'draw' THEN 1 ELSE 0 END) AS 'd',SUM(CASE WHEN sWinningTeam <> '${team}' AND sWinningTeam <> 'draw' THEN 1 ELSE 0 END) AS 'l' FROM MatchDB WHERE (sHomeTeam = '${team}' OR sAwayTeam = '${team}') AND bVoided = 1`
        );
        let goals = await DB.query(
          `SELECT SUM(CASE WHEN (iType IN(1,4) AND sTeam='${team}') OR (iType = 3 AND sTeam <> '${team}') THEN 1 ELSE 0 END) AS 'gf', SUM(CASE WHEN (iType IN(1,4) AND sTeam<>'${team}') OR (iType = 3 AND sTeam = '${team}') THEN 1 ELSE 0 END) AS 'ga'FROM EventDB INNER JOIN MatchDB ON EventDB.iMatchID = MatchDB.iID INNER JOIN PlayerDB ON PlayerDB.iID = EventDB.iPlayerID WHERE (sHomeTeam = '${team}' OR sAwayTeam = '${team}') AND bVoided = 1`
        );
        let eCups = await DB.query(
          `SELECT COUNT(DISTINCT(iCupID)) AS 'c' FROM MatchDB INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iID WHERE (sHomeTeam = '${team}' OR sAwayTeam = '${team}') AND bVoided = 1 AND iType = 1`
        );
        let bCups = await DB.query(
          `SELECT COUNT(DISTINCT(CONCAT(iYear,sSeason))) AS 'c' FROM MatchDB INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iID WHERE (sHomeTeam = '${team}' OR sAwayTeam = '${team}') AND bVoided = 1 AND iType IN (2,3)`
        );
        goals = goals[0];
        stats = stats[0];
        eCups = eCups[0].c;
        bCups = bCups[0].c;
        //wikiText += `{{Fb cl3 team|no-extras=yes|t={{team away|${team}}} |w=` . $stats['w'] . ` |d=` . $stats['d'] . ` |l=` . $stats['l'] . ` |gf=` . $goals['gf'] . ` |ga=` . $goals['ga'] . `}}\n`;
        let n = +stats["w"] + +stats["d"] + +stats["l"];
        let row = [
          h.teamLink(team),
          eCups,
          bCups,
          +eCups + +bCups,
          n,
          stats.w,
          stats.d,
          stats.l,
          parseFloat((stats.w / n) * 100).toFixed(2) + "%",
          stats.w * 3 + +stats.d,
          n ? parseFloat((stats.w * 3 + +stats.d) / n).toFixed(2) : "-",
          goals.gf,
          n ? parseFloat(goals.gf / n).toFixed(2) : "-",
          goals.ga,
          n ? parseFloat(goals.ga / n).toFixed(2) : "-",
          (goals.gf > goals.ga ? "+" : "") + goals.gf - goals.ga,
          n ? parseFloat((goals.gf - goals.ga) / n).toFixed(2) : "-",
        ];
        result.push(row);
      }
      await fs.writeFile(req.staticUrl, JSON.stringify(result));
    } else {
      result = JSON.parse(await fs.readFile(req.staticUrl));
    }
    res.send(result);
  };
  static team = async (req, res, next) => {
    let result = {};
    let team = req.params.teamID.split("-")[0];
    let sql = await DB.query(
      `
            SELECT sWinningTeam,CupDB.iType,MatchDB.iID,sHomeTeam,sAwayTeam,dUTCTime,iYear,sSeason 
            FROM MatchDB INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iID 
            WHERE CupDB.iType <=4 AND bVoided = 1 AND (sHomeTeam=? OR sAwayTeam=?) 
            AND sWinningTeam <> '' ORDER BY dUTCTime`,
      [team, team]
    );
    let Btemplate = {
      gd: 0,
      results: [],
    };
    let stats = {
      1: { bWin: { ...Btemplate }, bLose: { ...Btemplate }, cups: {} },
      2: { bWin: { ...Btemplate }, bLose: { ...Btemplate }, cups: {} },
      4: { bWin: { ...Btemplate }, bLose: { ...Btemplate }, cups: {} },
    };

    for (let i in sql) {
      let row = sql[i];
      let subsql = await DB.query(
        `
                SELECT SUM(CASE WHEN (iType = 3 AND sTeam <> ?) OR (iType IN (1,4) AND sTeam = ?) 
                THEN 1 ELSE 0 END) AS 'tg',SUM(CASE WHEN (iType = 3 AND sTeam = ?) 
                OR (iType IN (1,4) AND sTeam <> ?) THEN 1 ELSE 0 END) AS 'eg' 
                FROM EventDB INNER JOIN PlayerDB ON PlayerDB.iID = EventDB.iPlayerID 
                WHERE iMatchID = ? AND iType IN (1,3,4)`,
        [team, team, team, team, row.iID]
      ).then(function (result) {
        return result[0];
      });
      let tg = subsql.tg;
      let eg = subsql.eg;
      let gd = tg - eg;
      let e = row.sHomeTeam == team ? row.sAwayTeam : row.sHomeTeam;
      if (row.iType == 3) row.iType = 2;
      let cupSeason = row.iYear + row.sSeason;
      if (typeof stats[row.iType].cups[cupSeason] == "undefined") {
        stats[row.iType].cups[cupSeason] = {
          wins: 0,
          draws: 0,
          losses: 0,
          gf: 0,
          ga: 0,
        };
      }
      if (team == row.sWinningTeam) {
        stats[row.iType].cups[cupSeason].wins++;
      } else if (row.sWinningTeam == e) {
        stats[row.iType].cups[cupSeason].losses++;
      } else {
        stats[row.iType].cups[cupSeason].draws++;
      }
      stats[row.iType].cups[cupSeason].gf += +tg;
      stats[row.iType].cups[cupSeason].ga += +eg;
      if (gd > stats[row.iType].bWin.gd) {
        console.log(gd, stats[row.iType].bWin.gd);
        stats[row.iType].bWin.gd = gd;
        stats[row.iType].bWin.results = [
          `${tg} - ${eg} /${e}/ ${h.dateFormat(row.dUTCTime)}`,
        ];
      } else if (gd == stats[row.iType].bWin.gd) {
        stats[row.iType].bWin.results.push(
          `${tg} - ${eg} /${e}/ ${h.dateFormat(row.dUTCTime)}`
        );
      }
      if (gd < stats[row.iType].bLose.gd) {
        stats[row.iType].bLose.gd = gd;
        stats[row.iType].bLose.results = [
          `${tg} - ${eg} /${e}/ ${h.dateFormat(row.dUTCTime)}`,
        ];
      } else if (gd == stats[row.iType].bLose.gd) {
        stats[row.iType].bLose.results.push(
          `${tg} - ${eg} /${e}/ ${h.dateFormat(row.dUTCTime)}`
        );
      }
    }
    let statsHtml = `<h3 id='stats'>Stats</h3><table>
            <tr>
                <th></th>
                <th>App</th>
                <th>W</th>
                <th>D</th>
                <th>L</th>
                <th>Tot</th>
                <th>Eff</th>
                <th>GF</th>
                <th>GA</th>
                <th>GD</th>
                <th>Biggest Win</th>
                <th>Biggest Defeat</th>
            </tr>`;
    let tWins = 0;
    let tDraws = 0;
    let tLosses = 0;
    let tTotal = 0;
    let tGf = 0;
    let tGa = 0;
    let tGd = 0;
    let tEff = 0;
    let tApps = 0;
    for (let i in stats) {
      let statName = i == 1 ? "Elite" : i == 2 ? "Babby" : "Off Friendlies";
      statsHtml += `<tr>`;
      statsHtml += `<th colspan=${i == 4 ? 2 : 1}>${statName}</th>`;
      let wins = 0;
      let draws = 0;
      let losses = 0;
      let total = 0;
      let gf = 0;
      let ga = 0;
      let gd = 0;
      let eff = 0;
      let apps = 0;
      for (let j in stats[i].cups) {
        wins += stats[i].cups[j].wins;
        draws += stats[i].cups[j].draws;
        losses += stats[i].cups[j].losses;
        gf += stats[i].cups[j].gf;
        ga += stats[i].cups[j].ga;
      }
      total = wins + draws + losses;
      gd = gf - ga;
      eff = total ? Math.round((wins / total) * 10000) / 100 : 0;
      if (i != 4) {
        apps = Object.keys(stats[i].cups).length;
        statsHtml += `<td>${apps}</td>`;
      }
      tWins += wins;
      tDraws += draws;
      tLosses += losses;
      tGf += gf;
      tGa += ga;
      tApps += apps;
      statsHtml += `
                <td>${wins}</td>
                <td>${draws}</td>
                <td>${losses}</td>
                <td>${total}</td>
                <td>${eff}%</td>
                <td>${gf}</td>
                <td>${ga}</td>
                <td>${gd}</td>
                <td>${stats[i].bWin.results.join("<br>")}</td>
                <td>${stats[i].bLose.results.join("<br>")}</td>
            `;
      statsHtml += `</tr>`;
    }
    tTotal = tWins + tDraws + tLosses;
    tGd = tGf - tGa;
    tEff = tTotal ? Math.round((tWins / tTotal) * 10000) / 100 : 0;
    statsHtml += `
                <tr>
                <th>Overall</th>
                <th>${tApps}</td>
                <td>${tWins}</td>
                <td>${tDraws}</td>
                <td>${tLosses}</td>
                <td>${tTotal}</td>
                <td>${tEff}%</td>
                <td>${tGf}</td>
                <td>${tGa}</td>
                <td>${tGd}</td>
                </tr>
            `;
    statsHtml += `</table>`;
    let html = `<h2>/${team}/</h2>` + statsHtml;
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
