import { match } from "assert";
import DB from "../src/lib/db.js";
import * as h from "../src/lib/helper.js";
import fs from "fs/promises";
class model {
  static main = async (req, res, next) => {
    let stats = await fs.stat(req.staticUrl).catch((err) => {
      return { mtime: new Date("01/01/2000") };
    });
    let result = [];
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
          `SELECT SUM(CASE WHEN (iType IN(1,4) AND sTeam='${team}') OR (iType = 3 AND sTeam <> '${team}') THEN 1 ELSE 0 END) AS 'gf', SUM(CASE WHEN (iType IN(1,4) AND sTeam<>'${team}') OR (iType = 3 AND sTeam = '${team}') THEN 1 ELSE 0 END) AS 'ga'FROM EventDB INNER JOIN MatchDB ON EventDB.iMatchID = MatchDB.iMatchID INNER JOIN PlayerDB ON PlayerDB.iPlayerID = EventDB.iPlayerID WHERE (sHomeTeam = '${team}' OR sAwayTeam = '${team}') AND bVoided = 1`
        );
        let eCups = await DB.query(
          `SELECT COUNT(DISTINCT(MatchDB.iCupID)) AS 'c' FROM MatchDB INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iCupID WHERE (sHomeTeam = '${team}' OR sAwayTeam = '${team}') AND bVoided = 1 AND iType = 1`
        );
        let bCups = await DB.query(
          `SELECT COUNT(DISTINCT(CONCAT(iYear,sSeason))) AS 'c' FROM MatchDB INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iCupID WHERE (sHomeTeam = '${team}' OR sAwayTeam = '${team}') AND bVoided = 1 AND iType IN (2,3)`
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
            SELECT sWinningTeam,CupDB.iType,MatchDB.iMatchID,sHomeTeam,sAwayTeam,dUTCTime,iYear,sSeason,sName,sRound, bVoided 
            FROM MatchDB INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iCupID 
            WHERE CupDB.iType <=4 AND (sHomeTeam=? OR sAwayTeam=?) 
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
    let matches = [];
    let offMatches = 0;
    for (let i in sql) {
      let row = sql[i];
      let subsql = await DB.query(
        `
                SELECT SUM(CASE WHEN (iType = 3 AND sTeam <> ?) OR (iType IN (1,4) AND sTeam = ?) 
                THEN 1 ELSE 0 END) AS 'tg',SUM(CASE WHEN (iType = 3 AND sTeam = ?) 
                OR (iType IN (1,4) AND sTeam <> ?) THEN 1 ELSE 0 END) AS 'eg' 
                FROM EventDB INNER JOIN PlayerDB ON PlayerDB.iPlayerID = EventDB.iPlayerID 
                WHERE iMatchID = ? AND iType IN (1,3,4)`,
        [team, team, team, team, row.iID]
      ).then(function (result) {
        return result[0];
      });
      let tg = subsql.tg || 0;
      let eg = subsql.eg || 0;
      let gd = tg - eg;
      let e = row.sHomeTeam == team ? row.sAwayTeam : row.sHomeTeam;

      subsql = await DB.query(
        `
          SELECT * 
          FROM PlayerDB 
          INNER JOIN EventDB ON PlayerDB.iPlayerID = EventDB.iPlayerID
          WHERE iMatchID=? AND ((sTeam = ? AND iType IN (1,4)) OR (sTeam <> ? AND iType IN(3))) AND iLink > 0 ORDER BY iLink,dRegTime,dInjTime`,
        [row.iID, team, team]
      );
      let scorers = {};
      for (let scorerRow of Array.from(subsql)) {
        const pID = scorerRow.sTeam == team ? scorerRow.iLink : "0";
        scorers[pID] = scorers[pID] || { id: pID, goals: [] };
        let goal = scorerRow.dRegTime;
        if (scorerRow.dInjTime >= 0) goal += "+" + scorerRow.dInjTime;
        goal += `'`;
        scorers[pID].goals.push(goal);
      }
      let scorerArr = Object.values(scorers);
      scorerArr.sort((a, b) => {
        if (a.goals[0] > b.goals[0]) return 1;
        if (a.goals[0] < b.goals[0]) return -1;
        return 0;
      });
      if (row.bVoided) offMatches++;
      let match = {
        cup: h.cupShort(row.sName),
        round: row.sRound,
        date: h.dateFormat(row.dUTCTime, "short"),
        team: e,
        result: `${tg} - ${eg}`,
        scorers: scorerArr,
        num: row.bVoided ? offMatches : "",
        status: "",
      };
      if (!row.bVoided) {
        match.status = "V";
      } else if (team == row.sWinningTeam) {
        match.status = "W";
      } else if (row.sWinningTeam == e) {
        match.status = "L";
      } else {
        match.status = "D";
      }
      matches.push(match);
      if (row.bVoided) {
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
    let matchesHtml = `<h3 id='matches'>Matches</h3><table>
    <tr>
      <th>Cup</th>
      <th>Round</th>
      <th>Date</th>
      <th>Team</th>
      <th>Result</th>
      <th>Scorers</th>
    </tr>`;
    let cup = "";
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      matchesHtml += `<tr class=${match.status}>`;
      if (cup != match.cup) {
        cup = match.cup;
        let cupNum = 0;
        for (let j = i; j < matches.length; j++) {
          if (matches[j].cup == cup) {
            cupNum++;
          } else {
            break;
          }
        }
        matchesHtml += `<th style='background:var(--bg-color);color:var(--fg-color);vertical-align:top' rowspan=${cupNum}>${match.cup}</th>`;
      }
      let scorers = [];
      for (let player of match.scorers) {
        let goalStr = "";
        if (player.id == 0) {
          goalStr += "Own Goal ";
        } else {
          goalStr += (await h.playerLink(player.id)) + " ";
        }
        goalStr += player.goals.join(", ");
        scorers.push(goalStr);
      }
      matchesHtml += `
        <td>${match.round}</td>
        <td>${match.date}</td>
        <td>${h.teamLink(match.team)}</td>
        <td>${match.result}</td>
        <td>${scorers.join("<br>")}</td>
        <td style='background:var(--bg-color);color:var(--fg-color)'>${
          match.num
        }</td>
      `;
    }
    matchesHtml += "</table>";

    //Roster
    sql = await DB.query(
      `SELECT iYear, sSeason FROM CupDB INNER JOIN MatchDB ON CupDB.iCupID = MatchDB.iCupID WHERE sHomeTeam = ? AND iType <= 3 GROUP BY iYear, sSeason ORDER BY MAX(dStart)`,
      [team]
    );
    let cups = [];
    for (let row of Array.from(sql)) {
      cups.push({ year: row.iYear, season: row.sSeason });
    }

    let avgList = [];
    sql = await DB.query(
      `
  SELECT 
    sPlayer,iCupID,sMedal,bStarting,bCaptain,iLink,sSeason,iYear
  FROM 
    PlayerDB
  INNER JOIN 
    PlayerLinkDB ON PlayerDB.iLink = PlayerLinkDB.iID 
  INNER JOIN
      CupDB ON CupDB.iCupID = PlayerDB.iCupID
  LEFT JOIN
    PerformanceDB ON PlayerDB.iPlayerID = PerformanceDB.iPlayerID
  WHERE 
    PlayerDB.sTeam = ?
    AND sPlayer <> 'Unknown Player'
    AND iCupID IN (SELECT MAX(CupDB.iCupID) FROM CupDB INNER JOIN MatchDB ON CupDB.iCupID = MatchDB.iCupID WHERE (sHomeTeam = ? OR sAwayTeam = ?) AND iType <= 3 GROUP BY iYear, sSeason) 
  GROUP BY 
  sPlayer,iCupID,sMedal,bStarting,bCaptain,iLink,sSeason,iYear
  ORDER BY 
    iCupID,sPlayer`,
      [team, team, team]
    );
    let arr = {};
    for (let row of Array.from(sql)) {
      arr[row.iLink] = arr[row.iLink] || {
        id: row.iLink,
        cups: 0,
        name: await h.playerLink(row.iLink),
        truename: row.sPlayer,
      };
      let data = "";
      if (row["sMedal"] == "Gold") {
        data = 5;
      } else if (row["sMedal"] == "Silver") {
        data = 4;
      } else if (row["sMedal"] == "Bronze") {
        data = 3;
      } else if (row["bStarting"]) {
        data = 2;
      } else {
        data = 1;
      }
      if (row.bCaptain) data += 0.5;
      arr[row.iLink][row.iYear + row.sSeason] = data;
      arr[row.iLink].cups++;
    }
    for (let player of Object.values(arr)) {
      const id = player.id;
      sql = await DB.query(
        `SELECT COUNT(*) AS 'c' FROM MatchDB INNER JOIN PerformanceDB ON MatchDB.iMatchID = PerformanceDB.iMatchID INNER JOIN PlayerDB ON PlayerDB.iPlayerID = PerformanceDB.iPlayerID WHERE bVoided = 1 AND iLink=?`,
        [id]
      );
      player.apps = sql[0].c;
      sql = await DB.query(
        `SELECT CASE WHEN COUNT(*) > 0 THEN COUNT(*) ELSE '' END AS 'c' FROM EventDB INNER JOIN PlayerDB ON EventDB.iPlayerID = PlayerDB.iPlayerID INNER JOIN MatchDB ON MatchDB.iMatchID = EventDB.iMatchID WHERE iType IN(1,4) AND bVoided = 1 AND iLink=?`,
        [id]
      );
      player.goals = sql[0].c;
      sql = await DB.query(
        `SELECT CASE WHEN COUNT(*) > 0 THEN COUNT(*) ELSE '' END AS 'c' FROM EventDB INNER JOIN PlayerDB ON EventDB.iPlayerID = PlayerDB.iPlayerID INNER JOIN MatchDB ON MatchDB.iMatchID = EventDB.iMatchID WHERE iType IN(2) AND bVoided = 1 AND iLink=?`,
        [id]
      );
      player.assists = sql[0].c;
      sql = await DB.query(
        `SELECT SUM(iSaves) AS 'c' FROM PerformanceDB INNER JOIN PlayerDB ON PerformanceDB.iPlayerID = PlayerDB.iPlayerID INNER JOIN MatchDB ON MatchDB.iMatchID = PerformanceDB.iMatchID WHERE iSaves > -1 AND bVoided = 1 AND iLink=?`,
        [id]
      );
      player.saves = sql[0].c || "";
      sql = await DB.query(
        `SELECT AVG(dRating) AS 'c' FROM PerformanceDB INNER JOIN PlayerDB ON PerformanceDB.iPlayerID = PlayerDB.iPlayerID INNER JOIN MatchDB ON MatchDB.iMatchID = PerformanceDB.iMatchID WHERE dRating > -1 AND bVoided = 1 AND iLink=?`,
        [id]
      );
      player.rating = Math.round(sql[0].c * 100) / 100;
      avgList.push(player.apps);
    }
    let players = Object.values(arr);
    let avg =
      Math.round(
        (avgList.reduce((partialSum, a) => partialSum + a, 0) /
          avgList.length) *
          100
      ) / 100;
    let rosterHeader = [];
    rosterHeader.push([
      { text: "Roster Timeline", sort: "truename", dir: true },
      { text: "Apps", sort: "apps" },
      { text: "Cups", sort: "cups" },
      { text: "G", sort: "goals" },
      { text: "A", sort: "assists" },
      { text: "S", sort: "saves" },
      { text: "R", sort: "rating" },
    ]);
    let i = 0;
    do {
      const cup = cups[i];
      let yearLength = 0;
      for (let j = i; j < cups.length; j++) {
        if (cup.year == cups[j].year) {
          yearLength++;
        } else {
          break;
        }
      }
      rosterHeader[0].push({ text: cup.year, colSpan: yearLength });
      i += yearLength;
    } while (i < cups.length);
    rosterHeader.push([{ text: "", colSpan: 7 }]);
    for (let cup of cups) {
      rosterHeader[1].push({
        text: cup.season.substring(0, 3),
        sort: cup.year + cup.season,
      });
    }
    let rosterFooter = `<tr><td>Average Tenure</td><td></td><td>${avg}</td></tr>`;
    let html =
      statsHtml +
      matchesHtml +
      `<STYLE>
      .t5{
        background:#E0C068;
        color:#E0C068;
        width:20px;
      }
      .t4{
        background:#B7BEC5;
        color:#B7BEC5;
      }
      .t3{
        background:#BE9588;
        color:#BE9588;
      }
      .t2{
        background:#88C594;
        color:#88C594;
      }
      .t1{
        background:#AFE5BA;
        color:#AFE5BA;
      }
      .no{
        opacity:0;
      }
      .cap::after{
        content:" C";
        color:black;
      }
      .W a,
    .D a,
    .L a,
    .V a {
      color: black !important;
    }</STYLE>`;
    result.html = html;
    result.roster = {
      header: rosterHeader,
      footer: rosterFooter,
      data: players,
      cups,
    };
    result.date = new Date().toLocaleString("en-us", {
      timeStyle: "short",
      dateStyle: "medium",
    });
    await fs.writeFile(req.staticUrl, JSON.stringify(result));
    res.send(result);
  };
}
export { model as default };
