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
    let result = { list: [] };
    let html = "<h2>Rematches</h2>";
    let sql = await DB.query(
      "SELECT DISTINCT(sHomeTeam) AS 'team' FROM MatchDB INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iID WHERE iType <= 3 AND bVoided = 1 ORDER BY sHomeTeam"
    );
    let teams = [];
    for (let i in sql) {
      teams.push(sql[i].team);
    }
    for (let team1 of teams) {
      for (let team2 of teams) {
        if (team1 !== team2) {
          sql = await DB.query(
            "SELECT * FROM MatchDB INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iID WHERE iType <= 3 and bVoided = 1 AND ((sHomeTeam=? AND sAwayTeam = ?) OR (sHomeTeam=? AND sAwayTeam = ?)) ORDER BY dUTCTime DESC",
            [team1, team2, team2, team1]
          );
          let matchArr = [];
          for (let i of Array.from(sql)) {
            matchArr.push([i.sRound, i.sWinningTeam, i.dUTCTime]);
          }
          if (matchArr.length >= 6) {
            result.list.push({ team1, team2, matchArr });
          }
        }
      }
    }
    result.list.sort((a, b) => {
      if (a.matchArr.length > b.matchArr.length) return -1;
      if (a.matchArr.length < b.matchArr.length) return 1;
      return 0;
    });
    html += "<div class='rmCat'><table>";
    html +=
      "<tr><th># Times Played</th><th>Teams</th><th>Round</th><th>Winner</th><th>Date</th></tr>";
    for (let matchup of result.list) {
      let t1 = 0,
        t2 = 0,
        t3 = 0;
      for (let subresult of matchup.matchArr) {
        if (subresult[1] == matchup.team1) {
          t1++;
        } else if (subresult[1] == matchup.team2) {
          t2++;
        } else if (subresult[1] == "draw") {
          t3++;
        }
      }
      html += `<tr><td rowspan=${
        matchup.matchArr.length
      } style='vertical-align:top'>${matchup.matchArr.length}</td><td rowspan=${
        matchup.matchArr.length
      } style='vertical-align:top;text-align:center'>${teamLink(
        matchup.team1
      )} - ${teamLink(matchup.team2)}<br>${t1} - ${t3} - ${t2}</td>`;
      let first = true;
      for (let subresult of matchup.matchArr) {
        if (first) {
          first = false;
        } else {
          html += "<tr>";
        }
        html += `<td>${subresult[0]}</td><td>${teamLink(
          subresult[1]
        )}</td><td>${dateFormat(subresult[2])}</td></tr>`;
      }
    }
    html += "</table></div><div class='rmCat'>";
    let fastest = [];
    for (let i = 2; i <= 7; i++) {
      fastest[i] = [];
    }
    for (let team of teams) {
      let arr = {};
      sql = await DB.query(
        "SELECT * FROM MatchDB INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iID WHERE (sHomeTeam = ? OR sAwayTeam = ?) AND bVoided = 1 AND iType <= 3 ORDER BY dUTCTime",
        [team, team]
      );
      let i = 0;
      for (let match of Array.from(sql)) {
        i++;
        let at = match.sHomeTeam == team ? match.sAwayTeam : match.sHomeTeam;
        arr[at] = arr[at] || [];
        arr[at].push({ num: i, date: match.dUTCTime, round: match.sRound });
      }
      for (let i = 2; i <= 7; i++) {
        for (let at in arr) {
          let matches = arr[at];
          if (matches.length >= i) {
            for (let j = 0; j < matches.length - i; j++) {
              fastest[i].push({
                num: matches[i + j - 1].num - matches[j].num + 1,
                t1: team,
                t2: at,
                firstMatch: `${matches[i + j - 1].round} ${dateFormat(
                  matches[i + j - 1].date
                )}`,
                lastMatch: `${matches[j].round} ${dateFormat(matches[j].date)}`,
              });
            }
          }
        }
      }
    }
    for (let i = 2; i <= 7; i++) {
      fastest[i] = keySort(fastest[i], "num", false);
      html += `<h3>Fastest to rematch ${i + 1} times</h3>
            <table><tr><th>Team</th><th>Opponent</th><th>First Match</th><th>Last Match</th><th>Done in # matches</th></tr>`;
      for (let j = 0; j < 25; j++) {
        if (!fastest[i][j]) break;
        html += `<tr><td>${teamLink(fastest[i][j].t1)}</td><td>${teamLink(
          fastest[i][j].t2
        )}</td><td>${fastest[i][j].firstMatch}</td><td>${
          fastest[i][j].lastMatch
        }</td><td>${fastest[i][j].num}</td></tr>`;
      }
      html += "</table>";
    }
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
