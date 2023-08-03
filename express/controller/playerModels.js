import DB from "../lib/db.js";
import * as h from "../lib/helper.js";
import fs from "fs/promises";
class model {
  static main = async (req, res, next) => {
    let result = {};
    let html = "";

    let cups = 0;
    let team = "";
    let matches = 0;
    let minutes = 0;
    let avgRating = 0;
    let avgCond = 0;
    let totalGoals = 0;
    let totalAssists = 0;
    let totalSaves = 0;
    let totalYellows = 0;
    let totalReds = 0;
    let totalOGoals = 0;
    let aliases = [];
    let motm = 0;
    let pName = "";

    let playerID = req.params.playerID.split("-")[0];
    let playerData = await DB.query("SELECT * FROM PlayerLinkDB WHERE iID=?", [
      playerID,
    ]).then((result) => {
      return result[0];
    });
    team = playerData.sTeam;
    pName = playerData.sPlayer;

    let playerCupData = await DB.query("SELECT * FROM PlayerDB WHERE iLink=?", [
      playerID,
    ]).then((result) => {
      return result;
    });
    for (let i in playerCupData) {
      let row = playerCupData[i];
      if (!aliases.includes(row.sName)) aliases.push(row.sName);
    }
    cups = playerCupData.length;

    let cupList = playerCupData.map((x) => x.iCupID);
    cupList = await DB.query(
      `SELECT * From CupDB WHERE iID IN (${cupList.join(",")}) ORDER BY dStart`
    ).then((result) => {
      return result;
    });
    let totalMatchHtml = `<table id='matchTable'>
            <tr>
                <th>Cup</th>
                <th>Pos</th>
                <th>Round</th>
                <th>Date</th>
                <th>Team</th>
                <th>Play Time</th>
                <th>Cond</th>
                <th>Rating</th>
                <th>Events</th>
            </tr>`;
    for (let cup of cupList) {
      let query = `
            SELECT * FROM MatchDB 
            INNER JOIN PerformanceDB ON PerformanceDB.iMatchID = MatchDB.iID
            INNER JOIN PlayerDB ON PerformanceDB.iPlayerID = PlayerDB.iID
            WHERE MatchDB.iCupID = ${cup.iID} AND iLink = ${playerID}
            ORDER BY dUTCTime
            `;
      let sql = await DB.query(query);
      let matchesPlayed = [];
      let pos = "";
      let medal = "";
      for (let i in sql) {
        let row = sql[i];
        if (row.bVoided) {
          matches++;
        }
        pos = row.sRegPos;
        medal = row.sMedal;
        minutes +=
          row.iSubOn >= 0 && row.iSubOff >= 0 && row.bVoided
            ? row.iSubOff - row.iSubOn
            : 0;
        avgRating += row.bVoided && row.dRating > 0 ? row.dRating : 0;
        avgCond += row.bVoided && row.iCond > 0 ? row.iCond : 0;
        let events = [];
        let goals = [];
        let ogoals = [];
        let assists = [];
        let yellows = [];
        let reds = [];
        let saves = row.iSaves >= 0 ? row.iSaves : 0;
        if (row.bMotM) {
          events.push("Man of the Match");
          if (row.bVoided) motm++;
        }
        if (saves) {
          events.push("Saves: " + saves);
          if (row.bVoided) totalSaves += saves;
        }
        let subSql = await DB.query(
          `SELECT * FROM EventDB WHERE iMatchID=${row.iMatchID} AND iPlayerID=${row.iPlayerID}`
        );
        for (let j in subSql) {
          let event = subSql[j];
          switch (event.iType) {
            case 1:
            case 4:
              if (row.bVoided) totalGoals++;
              goals.push(
                event.dRegTime +
                  `'` +
                  (event.dInjTime >= 0 ? `+${event.dInjTime}` : "")
              );
              break;
            case 2:
              if (row.bVoided) totalAssists++;
              assists.push(
                event.dRegTime +
                  `'` +
                  (event.dInjTime >= 0 ? `+${event.dInjTime}` : "")
              );
              break;
            case 3:
              if (row.bVoided) totalOGoals++;
              ogoals.push(
                event.dRegTime +
                  `'` +
                  (event.dInjTime >= 0 ? `+${event.dInjTime}` : "")
              );
              break;
            case 5:
              if (row.bVoided) totalYellows++;
              yellows.push(
                event.dRegTime +
                  `'` +
                  (event.dInjTime >= 0 ? `+${event.dInjTime}` : "")
              );
              break;
            case 6:
            case 8:
              if (row.bVoided) totalReds++;
              reds.push(
                event.dRegTime +
                  `'` +
                  (event.dInjTime >= 0 ? `+${event.dInjTime}` : "")
              );
              break;
          }
        }
        let eventList = [
          ["Goals", goals],
          ["Own Goals", ogoals],
          ["Assists", assists],
          ["Yellows", yellows],
          ["Reds", reds],
        ];
        for (let event of eventList) {
          if (event[1].length) {
            events.push(
              `${event[0]}: ${event[1].length}(${event[1].join(", ")})`
            );
          }
        }
        matchesPlayed.push({
          result: row.bVoided
            ? row.sWinningTeam == "draw"
              ? "D"
              : row.sWinningTeam == team
              ? "W"
              : "L"
            : "V",
          round: row.sRound,
          date: h.dateFormat(row.dUTCTime, "short"),
          team: row.sHomeTeam == team ? row.sAwayTeam : row.sHomeTeam,
          played: `${row.iSubOn} - ${row.iSubOff}`,
          cond: row.iCond,
          rating: row.dRating,
          events: events,
          mNum: row.bVoided ? matches : "",
        });
      }
      let matchHtml = "";
      if (matchesPlayed.length) {
        for (let i in matchesPlayed) {
          let match = matchesPlayed[i];
          matchHtml += `<tr>`;
          if (i == 0) {
            matchHtml += `
                        <th rowspan=${matchesPlayed.length}>${h.cupShort(
              cup.sName
            )}</th>
                        <th rowspan=${
                          matchesPlayed.length
                        } class=${medal}>${pos}</th>`;
          }
          matchHtml += `
                        <td class='${match.result}'>${match.round}</td>
                        <td class='${match.result}'>${match.date}</td>
                        <td class='${match.result}'>/${match.team}/</td>
                        <td class='${match.result}'>${match.played}</td>
                        <td class='${match.result}'>${match.cond}</td>
                        <td class='${match.result}'>${match.rating}</td>
                        <td class='${match.result}'>${match.events.join(
            "<br>"
          )}</td>
                        <td>${match.mNum}</td>
                    `;
          matchHtml += `</tr>`;
        }
      } else {
        matchHtml += `
                    <tr>
                    <th>${h.cupShort(cup.sName)}</th>
                    <th class=${medal}>${pos}</th>
                    <td colspan=7 style='text-align:center'>Did not play</td>
                    </tr>`;
      }
      totalMatchHtml += matchHtml;
    }
    let cleanSheets = 0;
    let optionalStats = [
      ["MotM", motm],
      ["Goals", totalGoals],
      ["Assists", totalAssists],
      ["Saves", totalSaves],
      ["Clean Sheets", cleanSheets],
      ["Yellow Cards", totalYellows],
      ["Red Cards", totalReds],
    ];
    let overallHtml = `<table>
            <tr>
                <th>Cups</th>
                <td>${cups}</th>
            </tr><tr>
                <th>Matches</th>
                <td>${matches}</th>
            </tr><tr>
                <th>Minutes</th>
                <td>${minutes}</th>
            </tr><tr>
                <th>Avg Rating</th>
                <td>${
                  matches ? Math.round((avgRating * 100) / matches) / 100 : "-"
                }</th>
            </tr><tr>
                <th>Avg Cond</th>
                <td>${
                  matches ? Math.round((avgCond * 100) / matches) / 100 : "-"
                }</th>
            </tr>`;
    for (let optionalStat of optionalStats) {
      if (optionalStat[1] > 0) {
        overallHtml += `<tr>
                    <th>${optionalStat[0]}</th>
                    <td>${optionalStat[1]} (${
          Math.round((optionalStat[1] * 100) / matches) / 100
        })</td>
                </tr>
                `;
      }
    }
    overallHtml += `<tr><th colspan=2>Aliases</th></tr>${aliases
      .map((x) => `<tr><td colspan=2>${x}</td></tr>`)
      .join("")}`;
    let headerHtml = `<h2>${h.teamLink(team)} - ${pName}</h2>`;
    html = headerHtml + overallHtml + `</table>` + totalMatchHtml + `</table>`;
    html += `<STYLE>table{display:inline-block;vertical-align:top;margin:1rem}</STYLE>`;
    result.html = html;
    result.playerName = pName;
    result.playerTeam = team;
    result.date = new Date().toLocaleString("en-us", {
      timeStyle: "short",
      dateStyle: "medium",
    });
    await fs.writeFile(req.staticUrl, JSON.stringify(result));
    res.send(result);
  };
  static search = async (req, res, next) => {
    let search = "%" + req.body.search + "%";
    let sql = await DB.query(
      `
            SELECT sPlayer,PlayerDB.sTeam,iLink 
            FROM PlayerLinkDB
            INNER JOIN PlayerDB ON PlayerLinkDB.iID = PlayerDB.iLink 
            WHERE sPlayer LIKE ?
            OR sName LIKE ? 
            GROUP BY sPlayer,PlayerDB.sTeam,iLink
            ORDER BY sPlayer`,
      [search, search]
    );
    let result = [];
    for (let i in sql) {
      let row = sql[i];
      result.push({
        id: row.iLink,
        team: row.sTeam,
        urlName: row.sPlayer.replace(/./gm, function (s) {
          return s.match(/[a-z0-9]+/i) ? s : "";
        }),
        name: row.sPlayer,
      });
    }
    res.send(result);
  };
}
export { model as default };
