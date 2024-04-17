import DB from "../src/lib/db.js";
import {
  teamLink,
  pageExpiry,
  cupLink,
  playerLink,
  cupShort,
} from "../src/lib/helper.js";
import fs from "fs/promises";
class model {
  static main = async (req, res, next) => {
    let stats = await fs.stat(req.staticUrl).catch((err) => {
      return { mtime: new Date("01/01/2000") };
    });
    let result = [];
    if (new Date() - stats.mtime > pageExpiry) {
      let cups = await DB.query(
        "SELECT * FROM `CupDB` WHERE iType <= 4 ORDER BY dStart DESC",
        ""
      );
      let wikiText = ``;
      for (let i in cups) {
        let cupID = cups[i].iCupID;
        let cupName = cups[i].sName;
        //console.time(cupName);
        let sql = await DB.query(
          `SELECT COUNT(DISTINCT(sTeam)) AS c
        FROM 
        (
            SELECT DISTINCT(sHomeTeam) AS sTeam
            FROM MatchDB
            WHERE iCupID =?
            AND bOfficial = 1
            UNION
            SELECT DISTINCT(sAwayTeam) AS sTeam
            FROM MatchDB
            WHERE iCupID =?
            AND bOfficial = 1
        ) t
        `,
          [cupID, cupID]
        );
        let teams = sql[0].c;
        sql = await DB.query(
          `SELECT COUNT(*) AS c FROM MatchDB WHERE iCupID=? AND bOfficial=1`,
          [cupID]
        );
        let matches = sql[0].c;
        let first = "";
        let second = "";
        let third = "";
        let fourth = "";
        if (cups[i].iType < 3 && new Date(cups[i].dEnd < new Date())) {
          sql = await DB.query(
            `SELECT * FROM MatchDB WHERE iCupID=? AND bOfficial =1 ORDER BY dUTCTime DESC`,
            [cupID]
          );
          for (let i of Object.values(sql)) {
            if (!first) {
              first = teamLink(i.sWinningTeam);
              second = teamLink(
                i.sHomeTeam == i.sWinningTeam ? i.sAwayTeam : i.sHomeTeam
              );
              continue;
            }
            if (!third && i.sHomeTeam !== first && i.sAwayTeam !== second) {
              third = teamLink(i.sWinningTeam);
              fourth = teamLink(
                i.sHomeTeam == i.sWinningTeam ? i.sAwayTeam : i.sHomeTeam
              );
              break;
            }
          }
        }
        sql = await DB.query(
          `SELECT COUNT(*) AS c FROM MatchDB WHERE iCupID=? AND iEnd>1`,
          [cupID]
        );
        let etMatches = sql[0].c;
        sql = await DB.query(
          `SELECT COUNT(*) AS c FROM MatchDB WHERE iCupID=? AND iEnd=3`,
          [cupID]
        );
        let penMatches = sql[0].c;
        sql = await DB.query(
          `SELECT COUNT(*) AS c FROM EventDB INNER JOIN MatchDB ON EventDB.iMatchID = MatchDB.iMatchID WHERE iCupID=? AND bVoided = 1 AND iType IN(1,3,4)`,
          [cupID]
        );
        let goals = sql[0].c;
        sql = await DB.query(
          `SELECT SUM(CASE WHEN iType=3 THEN -1 ELSE 1 END) AS 'g', iLink
          FROM EventDB 
          INNER JOIN MatchDB ON EventDB.iMatchID = MatchDB.iMatchID
          INNER JOIN PlayerDB ON EventDB.iPlayerID = PlayerDB.iPlayerID
          WHERE 
          iTYPE IN (1,3,4)
          AND bVoided = 1
          AND bOfficial = 1
          AND MatchDB.iCupID = ?
          GROUP BY iLink
          ORDER BY SUM(CASE WHEN iType=3 THEN -1 ELSE 1 END) DESC
          LIMIT 1`,
          [cupID]
        );
        let goldenBoot = sql[0]?.iLink
          ? (await playerLink(sql[0].iLink)) + ` (${sql[0].g})`
          : "";
        sql = await DB.query(
          `SELECT COUNT(*) AS 'g', iLink
            FROM EventDB 
            INNER JOIN MatchDB ON EventDB.iMatchID = MatchDB.iMatchID
            INNER JOIN PlayerDB ON EventDB.iPlayerID = PlayerDB.iPlayerID
            WHERE 
            iTYPE IN (2)
            AND bVoided = 1
            AND bOfficial = 1
            AND MatchDB.iCupID = ?
            GROUP BY iLink
            ORDER BY COUNT(*) DESC
            LIMIT 1`,
          [cupID]
        );
        let goldenBall = sql[0]?.iLink
          ? (await playerLink(sql[0].iLink)) + ` (${sql[0].g})`
          : "";
        sql = await DB.query(
          `SELECT SUM(iSaves) AS 'g', iLink
            FROM PerformanceDB
            INNER JOIN MatchDB ON PerformanceDB.iMatchID = MatchDB.iMatchID
            INNER JOIN PlayerDB ON PerformanceDB.iPlayerID = PlayerDB.iPlayerID
            WHERE 
            iSaves > 0
            AND bVoided = 1
            AND bOfficial = 1
            AND MatchDB.iCupID = ?
            GROUP BY iLink
            ORDER BY COUNT(*) DESC
            LIMIT 1`,
          [cupID]
        );
        let goldenGlove = sql[0]?.iLink
          ? (await playerLink(sql[0].iLink)) + ` (${sql[0].g})`
          : "";
        sql = await DB.query(
          `SELECT COUNT(*) AS c FROM EventDB INNER JOIN MatchDB ON EventDB.iMatchID = MatchDB.iMatchID WHERE iCupID=? AND bVoided = 1 AND iType IN(5,8)`,
          [cupID]
        );
        let yellows = sql[0].c;
        sql = await DB.query(
          `SELECT COUNT(*) AS c FROM EventDB INNER JOIN MatchDB ON EventDB.iMatchID = MatchDB.iMatchID WHERE iCupID=? AND bVoided = 1 AND iType IN(6,8)`,
          [cupID]
        );
        let reds = sql[0].c;
        let row = [
          await cupLink(cupID),
          teams,
          matches,
          first,
          second,
          third,
          fourth,
          etMatches,
          penMatches,
          `${goals} (${
            matches > 0 ? Math.round((goals / matches) * 100) / 100 : 0
          })`,
          goldenBoot,
          goldenBall,
          goldenGlove,
          `${yellows} (${
            matches > 0 ? Math.round((yellows / matches) * 100) / 100 : 0
          })`,
          `${reds} (${
            matches > 0 ? Math.round((reds / matches) * 100) / 100 : 0
          })`,
        ];
        result.push(row);
        //console.timeEnd(cupName);
      }
      await fs.writeFile(req.staticUrl, JSON.stringify(result));
    } else {
      result = JSON.parse(await fs.readFile(req.staticUrl));
    }
    res.send(result);
  };
  static cup = async (req, res, next) => {
    let stats = await fs.stat(req.staticUrl).catch((err) => {
      return { mtime: new Date("01/01/2000") };
    });
    let result = {};
    if (new Date() - stats.mtime > pageExpiry) {
      let cupID = req.params.cupID.split("-")[0];
      let teams = [];
      let cupMeta = await DB.query("SELECT * FROM CupDB WHERE iCupID=?", [
        cupID,
      ]);
      let totalGoals = 0;
      let totalMatches = 0;
      let scorers = {};
      let owngoalers = {};
      let assisters = {};
      let goalies = {};
      let motms = {};
      cupMeta = cupMeta[0];
      let sql = await DB.query(
        `SELECT DISTINCT sHomeTeam FROM MatchDB WHERE iCupID=? ORDER BY sHomeTeam`,
        [cupID]
      );
      for (let i in sql) {
        let row = sql[i];
        teams.push({ name: row.sHomeTeam });
      }
      result.teams = teams;

      sql = await DB.query(
        "SELECT * FROM MatchDB INNER JOIN RoundOrder ON MatchDB.sRound = RoundOrder.sRound WHERE iCupID=? ORDER BY iOrder,RoundOrder.sRound,dUTCTime",
        [cupID]
      );
      let matches = {};
      for (let i in sql) {
        let row = sql[i];
        let roundType = "";
        totalMatches++;
        switch (row.iOrder) {
          case 1:
          case 2:
          case 3:
            roundType = "groups";
            break;
          default:
            roundType = "kos";
            break;
        }
        if (typeof matches[roundType] != "object") matches[roundType] = {};
        if (typeof matches[roundType][row.sRound] != "object")
          matches[roundType][row.sRound] = {
            name: row.sRound,
            matches: [],
            table: {},
          };
        let teams = [row.sHomeTeam, row.sAwayTeam];
        for (let team of teams) {
          if (typeof matches[roundType][row.sRound].table[team] != "object")
            matches[roundType][row.sRound].table[team] = {
              status: "red",
              data: [teamLink(team), 0, 0, 0, 0, 0, 0, 0, 0],
            };
        }

        let goals = [0, 1];
        let players = [{}, {}];

        let subSql = await DB.query(
          "SELECT * FROM EventDB INNER JOIN PlayerDB ON EventDB.iPlayerID = PlayerDB.iPlayerID WHERE iMatchID=? ORDER BY dRegTime,dInjTime",
          [row.iMatchID]
        );
        for (let j in subSql) {
          let e = subSql[j];
          let oTeam = e.sTeam;
          let aTeam = e.sTeam != row.sHomeTeam ? row.sHomeTeam : row.sAwayTeam;
          if (e.iType == 1 || e.iType == 4) {
            scorers[e.iLink] = scorers[e.iLink] || 0;
            scorers[e.iLink]++;
            matches[roundType][row.sRound].table[oTeam].data[5]++;
            matches[roundType][row.sRound].table[aTeam].data[6]++;
            totalGoals++;
            goals[oTeam == row.sHomeTeam ? 0 : 1]++;
          } else if (e.iType == 3) {
            owngoalers[e.iLink] = owngoalers[e.iLink] || 0;
            owngoalers[e.iLink]++;
            matches[roundType][row.sRound].table[oTeam].data[6]++;
            matches[roundType][row.sRound].table[aTeam].data[5]++;
            totalGoals++;
            goals[oTeam == row.sHomeTeam ? 1 : 0]++;
          } else if (e.iType == 2) {
            assisters[e.iLink] = assisters[e.iLink] || 0;
            assisters[e.iLink]++;
          }
          matches[roundType][row.sRound].table[oTeam].data[7] =
            matches[roundType][row.sRound].table[oTeam].data[5] -
            matches[roundType][row.sRound].table[oTeam].data[6];
          matches[roundType][row.sRound].table[aTeam].data[7] =
            matches[roundType][row.sRound].table[aTeam].data[5] -
            matches[roundType][row.sRound].table[aTeam].data[6];
        }

        for (let team of teams) {
          matches[roundType][row.sRound].table[team].data[1]++;
          if (row.sWinningTeam == "draw") {
            matches[roundType][row.sRound].table[team].data[3]++;
            matches[roundType][row.sRound].table[team].data[8]++;
          } else if (row.sWinningTeam == team) {
            matches[roundType][row.sRound].table[team].data[2]++;
            matches[roundType][row.sRound].table[team].data[8] += 3;
          } else {
            matches[roundType][row.sRound].table[team].data[4]++;
          }
        }

        matches[roundType][row.sRound].matches.push({
          date: new Date(row.dUTCTime).toLocaleDateString(),
          time: new Date(row.dUTCTime).toLocaleTimeString(),
          stadium: row.sStadium,
          attendance: row.iAttendence,
          home: row.sHomeTeam,
          away: row.sAwayTeam,
          winner: row.sWinningTeam,
          homeg: goals[0],
          awayg: goals[1],
          id: row.iMatchID,
          official: row.bVoided,
          roundOrder: row.iOrder,
        });
      }
      for (let i in matches) {
        for (let j in matches[i]) {
          matches[i][j].table = Object.values(matches[i][j].table);
          matches[i][j].table = matches[i][j].table.sort((a, b) => {
            if (b.data[8] == a.data[8]) {
              if (b.data[7] == a.data[7]) {
                if (b.data[5] == a.data[5]) {
                  return 0;
                } else {
                  return b.data[5] - a.data[5];
                }
              } else {
                return b.data[7] - a.data[7];
              }
            } else {
              return b.data[8] - a.data[8];
            }
          });
          matches[i][j].table[0].status = "green";
          matches[i][j].table[1].status = "green";
        }
        matches[i] = Object.values(matches[i]);
      }
      let scorerArr = [];
      for (let i in scorers) {
        if (!scorerArr[scorers[i]]) {
          scorerArr[scorers[i]] = { num: scorers[i], players: [] };
        }
        scorerArr[scorers[i]].players.push(await playerLink(i));
      }
      scorerArr.sort((a, b) => {
        if (a.num > b.num) return -1;
        return 1;
      });
      let assistArr = [];
      for (let i in assisters) {
        if (!assistArr[assisters[i]]) {
          assistArr[assisters[i]] = { num: assisters[i], players: [] };
        }
        assistArr[assisters[i]].players.push(await playerLink(i));
      }
      assistArr.sort((a, b) => {
        if (a.num > b.num) return -1;
        return 1;
      });
      result.cupID = cupID;
      result.cupName = cupMeta.sName;
      result.dates = `${new Date(
        cupMeta.dStart
      ).toLocaleDateString()} - ${new Date(cupMeta.dEnd).toLocaleDateString()}`;
      result.matches = matches;
      result.goals = totalGoals;
      result.numMatches = totalMatches;
      result.gpm =
        Math.floor((totalMatches ? totalGoals / totalMatches : 0) * 100) / 100;
      result.scorers = scorerArr;
      result.assisters = assistArr;
      result.owngoalers = owngoalers;
      await fs.writeFile(req.staticUrl, JSON.stringify(result));
    } else {
      result = JSON.parse(await fs.readFile(req.staticUrl));
    }
    res.send(result);
  };
  static edit = async (req, res, next) => {
    let result = {};
    let data = req.body;
    let rankPoints = 0;
    if (data.type == 1) {
      rankPoints = 21;
    } else if (data.type == 2) {
      rankPoints = 19;
    } else if (data.type == 2.5) {
      rankPoints = 21;
      data.type = 2;
    }
    let query = `INSERT INTO CupDB (sName,sSeason,iYear,iType,dStart,dEnd,iRankPoints,sUser,iPes) VALUES
    (?,?,?,?,?,?,?,?,?)`;
    await DB.query(query, [
      data.name,
      data.season,
      data.year,
      data.type,
      data.start,
      data.finish,
      rankPoints,
      data.user,
      data.version,
    ]);
    let cupID = await DB.query(
      `SELECT iCupID FROM CupDB ORDER BY iCupID DESC LIMIT 1`
    );
    cupID = cupID[0].iCupID;
    result.cupID = cupID;
    result.cupURL = `${cupID}-${cupShort(data.name).replace(" ", "-")}`;
    res.send(result);
  };
}
export { model as default };
