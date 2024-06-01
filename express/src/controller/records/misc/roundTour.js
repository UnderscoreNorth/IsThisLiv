import { match } from "assert";
import DB from "../../src/lib/db.js";
import {
  teamLink,
  pageExpiry,
  cupLink,
  dateFormat,
} from "../../src/lib/helper.js";
import fs from "fs/promises";
class model {
  static main = async (req, res, next) => {
    let result = {};
    let html = `<h2>Round Tour</h2>
    A table of the earliest cup that a board had played in for each group and knockout round.
    <br>Summer 11, Winter 12, and qualifier matches were not included in this.
    <br>Highlighted cells are the team's latest accomplishment.
    <br>Underlined cells are the team's latest group stage completion.
    <br>Sorted by earliest completion of the group stage tour.`;
    const rounds = [
      "Group A",
      "Group B",
      "Group C",
      "Group D",
      "Group E",
      "Group F",
      "Group G",
      "Group H",
      "Round of 16",
      "Quarter",
      "Semifinal",
      "Final",
    ];
    html +=
      "<table><tr><th></th><th colspan=8 >Group Stage</th><th colspan=4 >Knockout</th></tr>";
    html +=
      "<tr><td></td><td>A</td><td>B</td><td>C</td><td>D</td><td>E</td><td>F</td><td>G</td><td>H</td><td>RO16</td><td>QF</td><td>SF</td><td>F</td></tr>";
    let sql = await DB.query(
      "SELECT DISTINCT(sHomeTeam) FROM MatchDB WHERE bVoided = 1 ORDER BY sHomeTeam"
    );
    let teams = [];
    for (let row of Array.from(sql)) {
      const team = row.sHomeTeam;
      let temp = {
        team,
        latest: { date: 0, round: "" },
        latestGroup: { date: 0, round: "" },
        rounds: {},
      };
      let c = 0;
      for (let round of rounds) {
        let sql2 = await DB.query(
          `SELECT * FROM MatchDB INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iCupID WHERE sRound = ? AND (sHomeTeam=? OR sAwayTeam=?) AND iType <= 2 AND CupDB.iCupID > 2 ORDER BY dUTCTime`,
          [round, team, team]
        );
        let n = "";
        const result = sql2[0];
        if (result?.sName) {
          n = result.iYear + " " + result.sSeason.toString().substr(0, 1);
          if (result.iType == 2) n += "B";
          n += "C";
          temp.rounds[round] = n;
          let date = new Date(result.dUTCTime);
          if (date > temp.latest.date) {
            temp.latest.date = date;
            temp.latest.round = round;
          }
          if (date > temp.latestGroup.date && round.includes("Group")) {
            temp.latestGroup.date = date;
            temp.latestGroup.round = round;
          }
        }
      }
      teams.push(temp);
    }
    teams.sort((a, b) => {
      const numCompletedA = Object.keys(a.rounds).filter((x) =>
        x.includes("Group")
      ).length;
      const numCompletedB = Object.keys(b.rounds).filter((x) =>
        x.includes("Group")
      ).length;
      if (numCompletedA > numCompletedB) return -1;
      if (numCompletedA < numCompletedB) return 1;
      if (a.latestGroup.date > b.latestGroup.date) return 1;
      if (a.latestGroup.date < b.latestGroup.date) return -1;
      return 0;
    });
    for (let team of teams) {
      html += `<tr><td>${teamLink(team.team)}</td>`;
      for (let round of rounds) {
        html += "<td ";
        if (round == team.latest.round) {
          html += " class='W'";
        }
        if (round == team.latestGroup.round) {
          html += " style='text-decoration:underline;'";
        }
        html += `>`;
        html += team.rounds[round] || "";
        html += "</td>";
      }
      html += "</tr>";
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
