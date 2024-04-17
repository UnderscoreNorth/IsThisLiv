import DB from "../../src/lib/db.js";
import { goalTypes } from "../../src/lib/helper.js";
export default async function main(req, res, next) {
  const cupID = req.body.cupID;
  const rounds = ["r1", "r2", "r3", "r4", "ro16", "qf", "sf", "fn"];
  const posTypes = {
    GK: ["GK"],
    DEF: ["LB", "CB", "RB"],
    MID: ["DMF", "CMF", "AMF", "LMF", "RMF"],
    FWD: ["LWF", "RWF", "SS", "CF"],
  };
  let playerQ = await DB.query(
    `SELECT * FROM PlayerDB INNER JOIN RosterOrderLookUp ON PlayerDB.sRegPos = RosterOrderLookUp.sPos WHERE iCupID = ? ORDER BY PlayerDB.sTeam, RosterOrderLookUp.iOrder`,
    [cupID]
  );
  console.time("FF player scores");
  if (1 == 1) {
    for (let player of Object.values(playerQ)) {
      const pID = player.iID;
      const pTeam = player.sTeam;
      console.time(player.sName);
      let perfQ = await DB.query(
        `SELECT *,PerformanceDB.iID AS pID FROM PerformanceDB INNER JOIN MatchDB ON PerformanceDB.iMatchID = MatchDB.iMatchID WHERE iPlayerID=?`,
        [pID]
      );
      for (let pRow of Object.values(perfQ)) {
        let tempP = 0;
        let motmRating = await DB.query(
          `SELECT dRating FROM PerformanceDB WHERE iMatchID=? AND bMotM = 1`,
          [pRow.iMatchID]
        ).then((result) => {
          return result[0].dRating || 20;
        });
        let eventQ = await DB.query(
          `SELECT * FROM EventDB INNER JOIN PlayerDB ON EventDB.iPlayerID = PlayerDB.iPlayerID WHERE iMatchID=?`,
          [pRow.iMatchID]
        );
        let ag = 0;
        let agd = 0;
        for (let eRow of Object.values(eventQ)) {
          if (eRow.iPlayerID == pID) {
            if (goalTypes.includes(eRow.iType)) {
              if (player.iOrder >= 10) {
                tempP += 4; //Fwd goal
              } else if (player.iOrder >= 5) {
                tempP += 5; //Mid goal
              } else {
                tempP += 6; //def/gk goal
              }
            } else if (eRow.iType == 2) {
              tempP += 3; //assist
            } else if (eRow.iType == 9) {
              tempP -= 2; //missed pen
            } else if (eRow.iType == 10) {
              if (
                player.iOrder == 1 &&
                eRow.dRegTime > pRow.iSubOn &&
                eRow.dRegTime < pRow.iSubOff
              ) {
                tempP += 5; //GK saved pen
              } else {
                tempP -= 2; //shooter saved pen
              }
            } else if (eRow.iType == 3) {
              tempP -= 2; //own goal
            } else if (eRow.iType == 5) {
              tempP -= 1; //yellow card
            } else if (eRow.iType == 6) {
              tempP -= 3; //red card
            } else if (eRow.iType == 8) {
              tempP -= 4; //2nd yellow
            }
          }
          if (
            (goalTypes.includes(eRow.iType) && eRow.sTeam !== pTeam) ||
            (eRow.iType == 3 && eRow.sTeam == pTeam)
          ) {
            ag++;
            if (eRow.dRegTime >= pRow.iSubOn && eRow.dRegTime <= pRow.iSubOff) {
              agd++;
            }
          }
        }
        if (ag == 0) {
          if (player.iOrder < 5) {
            if (pRow.iSubOff - pRow.iSubOn >= 60) {
              tempP += 4; //def/gk clean sheet
            } else {
              tempP == 3; //def/gk partial clean sheet
            }
          } else if (player.iOrder < 10 && pRow.iSubOff - pRow.iSubOn >= 60) {
            tempP += 1; //mid clean sheet
          }
        } else if (ag >= 2 && player.iOrder < 5) {
          tempP -= Math.floor(agd / 2); //def/gk goals against
        }
        if (pRow.dRating > 0) {
          let rating = Math.floor(pRow.dRating - 4);
          switch (player.sRegPos) {
            case "CB":
            case "LB":
            case "RB":
            case "GK":
              rating *= 3;
              break;
            case "DMF":
            case "LMF":
            case "CMF":
            case "AMF":
            case "RMF":
              rating *= 2;
              break;
          }
          tempP += rating; //rating points
          if (pRow.bMotM) {
            tempP += 3; //Man of the match
          } else if (pRow.dRating >= motmRating) {
            tempP += 2; //Equaling MotM Rating
          } else if (pRow.dRating + 0.5 >= motmRating) {
            tempP += 1; //Almost equalling MotM Rating
          }
        }
        if (pRow.iSaves > 0) {
          tempP += Math.floor(pRow.iSaves / 2); //saves
        }
        await DB.query(`UPDATE PerformanceDB SET iFF=? WHERE iID=?`, [
          tempP,
          pRow.pID,
        ]);
      }
      console.timeEnd(player.sName);
    }
  }
  console.timeEnd("FF player scores");
  console.time("FF team scores");
  let teamQ = await DB.query(
    `SELECT FantasyDB.* FROM FantasyDB LEFT JOIN FantasyPDB ON FantasyDB.iID = FantasyPDB.iFFID WHERE iCupID = ? GROUP BY FantasyDB.iID HAVING COUNT(*) > 1 ORDER BY iID`,
    [cupID]
  );
  const tList = [];
  for (let team of Object.values(teamQ)) {
    const tName = team.sName;
    const tID = team.iID;
    console.time(tName);
    tList[tName] = [];
    const roster = [];
    let matchQ = await DB.query(
      `
    SELECT 
        iStage, bStart, FantasyPDB.iPlayerID, sName, sRegPos, sTeam, sMedal,iCap
    FROM 
        FantasyPDB 
    INNER JOIN 
        PlayerDB ON FantasyPDB.iPlayerID = PlayerDB.iPlayerID 
    INNER JOIN 
        RosterOrderLookUp ON PlayerDB.sRegPos = RosterOrderLookUp.sPos 
    WHERE 
        iFFID = ? 
    ORDER BY iStage, bStart DESC, iOrder, sTeam, sName`,
      [tID]
    );
    let cI = -1;
    for (let match of Object.values(matchQ)) {
      cI++;
      switch (match.sMedal) {
        case "Gold":
          match.sMedal = 4;
          break;
        case "Silver":
          match.sMedal = 3;
          break;
        case "Bronze":
          match.sMedal = 2;
          break;
        default:
          match.sMedal = 1;
          break;
      }
      roster[cI] = {
        medal: match.sMedal,
        team: match.sTeam,
        pos: match.sRegPos,
        name: match.sName,
        cap: match.iCap,
        id: match.iPlayerID,
        tot: 0,
      };
    }
    if (cI < 17) {
      for (let i = 0; i < 17; i++) {
        roster[i + 17] = roster[i];
      }
    }
    for (let i = 0; i < 34; i++) {
      let cond =
        i < 17
          ? ` AND sRound LIKE '%Group%' `
          : ` AND sROUND NOT LIKE '%Group%' `;
      const player = roster[i];
      matchQ = await DB.query(
        `
            SELECT 
                sRound, iFF, dUTCTime
            FROM 
                PlayerDB
            INNER JOIN
                PerformanceDB ON PerformanceDB.iPlayerID = PlayerDB.iPlayerID
            INNER JOIN
                MatchDB ON MatchDB.iMatchID = PerformanceDB.iMatchID
            WHERE  
                bVoided = 1 
                AND PerformanceDB.iPlayerID = ?
                ${cond}
            ORDER BY dUTCTime`,
        [player.id]
      );
      for (let match of Object.values(matchQ)) {
        let round = "";
        if (match.sRound.includes("Group")) {
          let groupNumQ = await DB.query(
            `SELECT dUTCTime FROM MatchDB WHERE (sHomeTeam = ? OR sAwayTeam = ?) AND iCupID = ? AND sRound LIKE '%GROUP%' AND bVoided = 1 ORDER BY dUTCTime`,
            [player.team, player.team, cupID]
          );
          let count = 0;
          for (let groupNum of Object.values(groupNumQ)) {
            count++;
            if (groupNum.dUTCTime.toString() == match.dUTCTime.toString()) {
              round = "r" + count;
              break;
            }
          }
        } else if (match.sRound == "Round of 16") {
          round = "ro16";
        } else if (match.sRound == "Quarter") {
          round = "qf";
        } else if (match.sRound == "Semifinal") {
          round = "sf";
        } else if (match.sRound == "3rd Place" || match.sRound == "Final") {
          round = "fn";
        }
        if (round && match.iFF > -99) player[round] = match.iFF;
      }
    }
    for (let round of rounds) {
      let cap = false;
      let unplayed = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
      let subbers = [];
      let start = ["r1", "r2", "r3", "r4"].includes(round) ? 0 : 17;
      for (let i = 0; i < 17; i++) {
        const ii = start + i;
        const player = roster[ii];
        if (player[round] != undefined && player.cap == 2) {
          cap = true;
          if (player[round] > 0) player[round] *= 2;
        }
        if (player[round == undefined && i < 11]) {
          unplayed[player.pos]++;
        }
      }
      for (let pos in unplayed) {
        if (unplayed[pos]) {
          let subScores = [];
          for (let i = 11; i < 17; i++) {
            const ii = start + i;
            const player = roster[ii];
            if (posTypes[pos].includes(player.pos)) {
              subScores.push({ index: ii, score: player[round] });
            }
          }
          subScores.sort((a, b) => {
            if (a.score > b.score) return 1;
            if (a.score < b.score) return -1;
            return 0;
          });
          if (unplayed[pos] == 1) {
            if (subScores[1]) roster[subScores[1].index][round] = "";
          }
        } else {
          for (let i = 11; i < 17; i++) {
            const ii = start + i;
            const player = roster[ii];
            if (posTypes[pos].includes(player.pos)) {
              player[round] = "";
            }
          }
        }
      }
      if (!cap) {
        for (let i = 0; i < 17; i++) {
          const ii = start + i;
          const player = roster[ii];
          if (player[round] != undefined && player.cap == 1) {
            cap = true;
            if (player[round] > 0) player[round] *= 2;
          }
        }
      }
      for (let i = 0; i < 34; i++) {
        const player = roster[i];
        player.tot += player[round] || 0;
      }
    }
    for (let i = 0; i < 34; i++) {
      const player = roster[i];
      await DB.query(
        `UPDATE FantasyPDB SET r1=?,r2=?,r3=?,r4=?,ro16=?,qf=?,sf=?,fn=?,tot=? WHERE iFFID=? AND iPlayerID=? AND bStart=?`,
        [
          player.r1 || null,
          player.r2 || null,
          player.r3 || null,
          player.r4 || null,
          player.ro16 || null,
          player.qf || null,
          player.sf || null,
          player.fn || null,
          player.tot || null,
          tID,
          player.id,
          i < 17 ? 0 : 1,
        ]
      );
    }
    console.timeEnd(tName);
  }
  console.timeEnd("FF team scores");
  res.send("done");
}
