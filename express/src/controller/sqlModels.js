import DB from "../src/lib/db.js";
import { teamLink, pageExpiry } from "../src/lib/helper.js";
import fs from "fs/promises";
const conditionArrows = { 5: "↑", 4: "↗", 3: "→", 2: "↘", 1: "↓" };

class model {
  static matchDisplay = async (req, res, next) => {
    let matchID = req.params.matchID;
    let matchMeta = await DB.query("SELECT * FROM MatchDB WHERE iID=?", [
      matchID,
    ]);
    matchMeta = matchMeta[0];
    let data = {
      home: matchMeta.sHomeTeam,
      away: matchMeta.sAwayTeam,
      winner: matchMeta.sWinningTeam,
      round: matchMeta.sRound,
      date: matchMeta.dUTCTime,
      cupID: matchMeta.iCupID,
      attendence: matchMeta.iAttendence,
      version: matchMeta.iPes,
      stadium: matchMeta.sStadium,
      off: matchMeta.bVoided,
      rounds: [],
      stadiums: [],
    };

    let eventCounter = 0;
    let teams = [data.home, data.away];

    data.eventType = {};
    let sql = await DB.query("SELECT * FROM EventTypeLookUp");
    for (let i in sql) {
      data.eventType[sql[i].iGoalType] = sql[i].sDescription;
    }

    sql = await DB.query("SELECT * FROM RoundOrder");
    for (let i in sql) {
      data.rounds.push(sql[i].sRound);
    }

    sql = await DB.query(
      "SELECT DISTINCT(sStadium) FROM MatchDB WHERE iCupID=? ORDER BY sStadium",
      [data.cupID]
    );
    for (let i in sql) {
      data.stadiums.push(sql[i].sStadium);
    }

    data.matchStats = [[], [], []];
    sql = await DB.query(
      "SELECT * FROM MatchStatDB WHERE iMatchID=? ORDER BY iHalf,bHome",
      [matchID]
    );
    for (let i in sql) {
      data.matchStats[sql[i].iHalf - 1][sql[i].bHome] = [
        { sql: "iID", name: "SQL ID", value: sql[i].iID },
        { sql: "iPoss", name: "Posesssion (%)", value: sql[i].iPoss },
        { sql: "iShots", name: "Shots", value: sql[i].iShots },
        { sql: "iShotsOT", name: "(on target)", value: sql[i].iShotsOT },
        { sql: "iFouls", name: "Fouls", value: sql[i].iFouls },
        { sql: "iOffsides", name: "(offside)", value: sql[i].iOffsides },
        { sql: "iCorners", name: "Corner Kicks", value: sql[i].iCorners },
        { sql: "iFreeKicks", name: "Free Kicks", value: sql[i].iFreeKicks },
        {
          sql: "iPassComp",
          name: "Pass completed (%)",
          value: sql[i].iPassComp,
        },
        { sql: "iPassTot", name: "Passes", value: sql[i].iPassTot },
        { sql: "iPassMade", name: "(Made)", value: sql[i].iPassMade },
        { sql: "iCrosses", name: "Crosses", value: sql[i].iCrosses },
        {
          sql: "iInterceptions",
          name: "Interceptions",
          value: sql[i].iInterceptions,
        },
        { sql: "iTackles", name: "Tackles", value: sql[i].iTackles },
        { sql: "iSaves", name: "Saves", value: sql[i].iSaves },
      ];
    }

    data.players = [[], []];
    data.performances = [[], []];
    data.events = [[], []];
    data.penalties = [[], []];
    for (let i in teams) {
      let team = teams[i];
      sql = await DB.query(
        "SELECT * FROM PlayerDB WHERE iCupID=? AND sTeam=? ORDER BY sName",
        [data.cupID, team]
      );
      for (let j in sql) {
        data.players[i].push(sql[j]);
      }
      sql = await DB.query(
        "SELECT PerformanceDB.* FROM PerformanceDB INNER JOIN PlayerDB ON PerformanceDB.iPlayerID = PlayerDB.iPlayerID WHERE sTeam=? AND iMatchID=? ORDER BY iSubOn,PerformanceDB.iID",
        [team, matchID]
      );
      for (let j in sql) {
        data.performances[i].push(sql[j]);
      }
      sql = await DB.query(
        "SELECT EventDB.* FROM EventDB INNER JOIN PlayerDB ON EventDB.iPlayerID = PlayerDB.iPlayerID WHERE sTeam=? AND iMatchID=? ORDER BY dRegTime,dInjTime,iType",
        [team, matchID]
      );
      for (let j in sql) {
        data.events[i].push(sql[j]);
      }
      sql = await DB.query(
        "SELECT PenaltyDB.* FROM PenaltyDB INNER JOIN PlayerDB ON PenaltyDB.iPlayerID = PlayerDB.iPlayerID WHERE sTeam=? AND iMatchID=? ORDER BY PenaltyDB.iID",
        [team, matchID]
      );
      for (let j in sql) {
        data.penalties[i].push(sql[j]);
      }
    }
    teams = [""].concat(teams);
    teams.push("draw");
    data.teams = teams;
    res.send(data);
  };
  static matchEdit = async (req, res, next) => {};
}
export { model as default };
