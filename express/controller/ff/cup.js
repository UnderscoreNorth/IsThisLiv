import DB from "../../lib/db.js";
export default async function main(req, res, next) {
  const cupID = req.body.cupID;
  let result = await DB.query(
    `
  SELECT 
    sTeam,RoundOrder.sRound, dUTCTime, SUM(iFF) AS ff
  FROM 
    PerformanceDB
  INNER JOIN
    PlayerDB
  ON 
    PerformanceDB.iPlayerID = PlayerDB.iPlayerID
  INNER JOIN
    MatchDB
  ON
    PerformanceDB.iMatchID = MatchDB.iMatchID
  INNER JOIN
    RoundOrder
  ON	
    RoundOrder.sRound = MatchDB.sRound
  WHERE
    MatchDB.iCupID = ? AND iFF > -99
  GROUP BY 
    dUTCTime, sTeam,MatchDB.sRound, iOrder
  ORDER BY    
      sTeam,RoundOrder.iOrder, dUTCTime`,
    [cupID]
  );
  let boardData = {};
  for (let row of Object.values(result)) {
    const team = "/" + row.sTeam + "/";
    const ff = row.ff;
    let round = "";
    boardData[team] = boardData[team] || { team, tot: 0 };

    if (row.sRound.includes("Group")) {
      let r = 1;
      do {
        if (boardData[team]["r" + r]) {
          r++;
        } else {
          round = "r" + r;
        }
      } while (!round);
    } else if (row.sRound == "Final" || row.sRound == "3rd Place") {
      round = "fn";
    } else if (row.sRound == "Semifinal") {
      round = "sf";
    } else if (row.sRound == "Quarter") {
      round = "qf";
    } else if (row.sRound == "Round of 16") {
      round = "ro16";
    }
    if (round) {
      boardData[team][round] = ff;
      boardData[team].tot += ff * 1;
    }
  }
  result = await DB.query(
    `
  SELECT 
    FantasyDB.sName, 
      SUM(r1) AS r1, 
      SUM(r2) as r2, 
      SUM(r3) as r3, 
      SUM(r4) as r4, 
      SUM(ro16) as ro16, 
      SUM(qf) AS qf, 
      SUM(sf) AS sf, 
      SUM(fn) as fn
  FROM 
      PlayerDB
  INNER JOIN
    FantasyPDB
  ON
    FantasyPDB.iPlayerID = PlayerDB.iPlayerID
  INNER JOIN
    FantasyDB
  ON
    FantasyPDB.iFFID = FantasyDB.iID
  WHERE
      PlayerDB.iCupID = ?
  GROUP BY 
      FantasyDB.sName
  ORDER BY    
    FantasyDB.sName`,
    [cupID]
  );
  let teamData = {};
  for (let row of Object.values(result)) {
    const team = row.sName;
    const rounds = ["r1", "r2", "r3", "r4", "ro16", "qf", "sf", "fn"];
    teamData[team] = teamData[team] || { team, tot: 0 };
    for (let round of rounds) {
      const ff = row[round];
      teamData[team][round] = ff;
      teamData[team].tot += ff * 1;
    }
  }
  result = await DB.query(
    `
  SELECT 
    sTeam,RoundOrder.sRound, dUTCTime, SUM(iFF) AS ff, sName,sRegPos, sMedal
  FROM 
    PerformanceDB
  INNER JOIN
    PlayerDB
  ON 
    PerformanceDB.iPlayerID = PlayerDB.iPlayerID
  INNER JOIN
    MatchDB
  ON
    PerformanceDB.iMatchID = MatchDB.iMatchID
  INNER JOIN
    RoundOrder
  ON	
    RoundOrder.sRound = MatchDB.sRound
  WHERE
    MatchDB.iCupID = ? AND iFF > -99
  GROUP BY 
    dUTCTime, sName, sTeam,MatchDB.sRound, iOrder,sRegPos, sMedal
  ORDER BY    
      sTeam,RoundOrder.iOrder, dUTCTime`,
    [cupID]
  );
  let playerData = {};
  for (let row of Object.values(result)) {
    const team = "/" + row.sTeam + "/";
    const player = row.sName;
    const ff = row.ff;
    const pos = row.sRegPos;
    const medal = row.sMedal;
    let round = "";
    playerData[player] = playerData[player] || {
      medal,
      player,
      team,
      pos,
      tot: 0,
    };

    if (row.sRound.includes("Group")) {
      let r = 1;
      do {
        if (playerData[player]["r" + r]) {
          r++;
        } else {
          round = "r" + r;
        }
      } while (!round);
    } else if (row.sRound == "Final" || row.sRound == "3rd Place") {
      round = "fn";
    } else if (row.sRound == "Semifinal") {
      round = "sf";
    } else if (row.sRound == "Quarter") {
      round = "qf";
    } else if (row.sRound == "Round of 16") {
      round = "ro16";
    }
    if (round) {
      playerData[player][round] = ff;
      playerData[player].tot += ff * 1;
    }
  }
  res.send({
    boardData,
    teamData,
    playerData,
  });
}
