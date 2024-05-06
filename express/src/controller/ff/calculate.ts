import { Request } from "express";
import { getEvents, getPerformances, getPlayers } from "../../db/commonFn";
import {
  assistTypes,
  goalTypes,
  goalTypesOG,
  missedPenType,
  savedPenType,
  secondYellowType,
  straightRedType,
  yellowCardTypes,
} from "../../lib/helper";
import { db } from "../../db";
import {
  Fantasy,
  FantasyPlayer,
  Match,
  Performance,
  Player,
} from "../../db/schema";
import { and, count, desc, eq, gt, like, lt, not, or } from "drizzle-orm";

export default async function calculate(req: Request) {
  const cupID = req.body.cupID;
  const rounds = ["r1", "r2", "r3", "r4", "ro16", "qf", "sf", "fn"];
  const posTypes = {
    GK: ["GK"],
    DEF: ["LB", "CB", "RB"],
    MID: ["DMF", "CMF", "AMF", "LMF", "RMF"],
    FWD: ["LWF", "RWF", "SS", "CF"],
  };
  const posTypeLookUp: Record<string, string> = {};
  for (let posType in posTypes) {
    for (let pos of posTypes[posType]) {
      posTypeLookUp[pos] = posType;
    }
  }
  const playerQ = await getPlayers({ cupID });
  for (const p of playerQ) {
    const { playerID, team } = p.player;
    const perfQ = await getPerformances({ playerID });

    for (const perf of perfQ) {
      let tempP = 0;
      const matchID = perf.match.matchID;
      const motmRating =
        (await getPerformances({ matchID, motm: true }))?.[0]?.performance
          ?.rating || 20;
      const eventQ = await getEvents({ matchID });
      let ag = 0;
      let agd = 0;
      for (const e of eventQ) {
        if (e.player.playerID == playerID) {
          if (goalTypes.includes(e.event.eventType)) {
            if (p.rosterorder.order >= 10) {
              tempP += 4; //Fwd goal
            } else if (p.rosterorder.order >= 5) {
              tempP += 5; //Mid goal
            } else {
              tempP += 6; //def/gk goal
            }
          } else if (assistTypes.includes(e.event.eventType)) {
            tempP += 3; //assist
          } else if (missedPenType.includes(e.event.eventType)) {
            tempP -= 2; //missed pen
          } else if (savedPenType.includes(e.event.eventType)) {
            if (
              p.rosterorder.order == 1 &&
              e.event.regTime > perf.performance.subOn &&
              e.event.regTime < perf.performance.subOff
            ) {
              tempP += 5; //GK saved pen
            } else {
              tempP -= 2; //shooter saved pen
            }
          } else if (goalTypesOG.includes(e.event.eventType)) {
            tempP -= 2; //own goal
          } else if (yellowCardTypes.includes(e.event.eventType)) {
            tempP -= 1; //yellow card
          } else if (straightRedType.includes(e.event.eventType)) {
            tempP -= 3; //red card
          } else if (secondYellowType.includes(e.event.eventType)) {
            tempP -= 4; //2nd yellow
          }
        }
        if (
          (goalTypes.includes(e.event.eventType) && e.player.team !== team) ||
          (goalTypesOG.includes(e.event.eventType) && e.player.team == team)
        ) {
          ag++;
          if (
            e.event.regTime >= perf.performance.subOn &&
            e.event.regTime <= perf.performance.subOff
          ) {
            agd++;
          }
        }
      }
      if (ag == 0) {
        if (p.rosterorder.order < 5) {
          if (perf.performance.subOff - perf.performance.subOn >= 60) {
            tempP += 4; //def/gk clean sheet
          } else {
            tempP == 3; //def/gk partial clean sheet
          }
        } else if (
          p.rosterorder.order < 10 &&
          perf.performance.subOff - perf.performance.subOn >= 60
        ) {
          tempP += 1; //mid clean sheet
        }
      } else if (ag >= 2 && p.rosterorder.order < 5) {
        tempP -= Math.floor(agd / 2); //def/gk goals against
      }
      if (perf.performance.rating > 0) {
        let rating = Math.floor(perf.performance.rating - 4);
        switch (p.player.regPos) {
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
        if (perf.performance.motm) {
          tempP += 3; //Man of the match
        } else if (perf.performance.rating >= motmRating) {
          tempP += 2; //Equaling MotM Rating
        } else if (perf.performance.rating + 0.5 >= motmRating) {
          tempP += 1; //Almost equalling MotM Rating
        }
      }
      if (perf.performance.saves > 0) {
        tempP += Math.floor(perf.performance.saves / 2); //saves
      }
      await db
        .update(Performance)
        .set({ ff: tempP })
        .where(eq(Performance.perfID, perf.performance.perfID));
    }
  }
  const teamQ = await db
    .select({ team: Fantasy })
    .from(Fantasy)
    .innerJoin(FantasyPlayer, eq(Fantasy.teamID, FantasyPlayer.teamID))
    .where(eq(Fantasy.cupID, cupID))
    .groupBy(Fantasy.teamID)
    .having(gt(count(), 1));
  const tList = [];
  for (const { team } of teamQ) {
    const tName = team.name;
    const tID = team.teamID;
    tList[tName] = [];
    const roster: Array<{
      medal: string;
      team: string;
      pos: string;
      name: string;
      cap: number;
      playerID: number;
      tot: number;
    }> = [];
    const playerQ = await db
      .select()
      .from(FantasyPlayer)
      .innerJoin(Player, eq(Player.playerID, FantasyPlayer.playerID))
      .where(eq(FantasyPlayer.teamID, tID))
      .orderBy(FantasyPlayer.stage, desc(FantasyPlayer.start));
    let cI = -1;
    for (let p of playerQ) {
      cI++;
      switch (p.player.medal) {
        case "Gold":
          p.player.medal = "4";
          break;
        case "Silver":
          p.player.medal = "3";
          break;
        case "Bronze":
          p.player.medal = "2";
          break;
        default:
          p.player.medal = "1";
          break;
      }
      roster[cI] = {
        medal: p.player.medal,
        team: p.player.team,
        pos: p.player.regPos,
        name: p.player.name,
        cap: p.fantasyp.cap,
        playerID: p.player.playerID,
        r1: null,
        r2: null,
        r3: null,
        r4: null,
        ro16: null,
        qf: null,
        sf: null,
        fn: null,
        tot: 0,
      };
    }
    if (cI < 17) {
      for (let i = 0; i < 17; i++) {
        roster[i + 17] = roster[i];
      }
    }
    for (let i = 0; i < 34; i++) {
      const player = roster[i];
      const matchQ = await db
        .select({
          round: Match.round,
          ff: Performance.ff,
          utcTime: Match.utcTime,
        })
        .from(Player)
        .innerJoin(Performance, eq(Player.playerID, Performance.playerID))
        .innerJoin(Match, eq(Match.matchID, Performance.matchID))
        .where(
          and(
            eq(Match.valid, 1),
            eq(Performance.playerID, player.playerID),
            i < 17
              ? like(Match.round, "%Group%")
              : not(like(Match.round, "%Group%"))
          )
        )
        .orderBy(Match.utcTime);
      for (const match of matchQ) {
        let round = "";
        if (match.round.includes("Group")) {
          const groupNumQ = await db
            .select({ utcTime: Match.utcTime })
            .from(Match)
            .where(
              and(
                or(
                  eq(Match.homeTeam, player.team),
                  eq(Match.awayTeam, player.team)
                ),
                eq(Match.cupID, cupID),
                like(Match.round, "%Group%")
              )
            )
            .orderBy(Match.utcTime);
          let count = 0;
          for (const { utcTime } of groupNumQ) {
            count++;
            if (utcTime.toString() == match.utcTime.toString()) {
              round = "r" + count;
              break;
            }
          }
        } else if (match.round == "Round of 16") {
          round = "ro16";
        } else if (match.round == "Quarter") {
          round = "qf";
        } else if (match.round == "Semifinal") {
          round = "sf";
        } else if (match.round == "3rd Place" || match.round == "Final") {
          round = "fn";
        }
        if (round && match.ff > -99) player[round] = match.ff;
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
        if (player[round] !== undefined && player.cap == 2) {
          cap = true;
          if (player[round] > 0) player[round] *= 2;
        }
        if ([undefined, null].includes(player[round]) && i < 11) {
          unplayed[posTypeLookUp[player.pos]]++;
        }
      }
      for (let pos in unplayed) {
        if (unplayed[pos] > 0) {
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
          if (unplayed[pos] == 1 && subScores.length == 2) {
            roster[subScores[1].index][round] = null;
          }
        } else {
          for (let i = 11; i < 17; i++) {
            const ii = start + i;
            const player = roster[ii];
            if (posTypes[pos].includes(player.pos)) {
              player[round] = null;
            }
          }
        }
      }
      if (!cap) {
        for (let i = 0; i < 17; i++) {
          const ii = start + i;
          const player = roster[ii];
          if (player[round] !== undefined && player.cap == 1) {
            cap = true;
            if (player[round] > 0) player[round] *= 2;
          }
        }
      }
      for (let i = 0; i < 17; i++) {
        const ii = start + i;
        const player = roster[ii];
        player.tot += parseInt(player[round]) > -99 ? player[round] : 0;
      }
    }
    for (let i = 0; i < 34; i++) {
      const player = roster[i];
      await db
        .update(FantasyPlayer)
        .set(player)
        .where(
          and(
            eq(FantasyPlayer.teamID, tID),
            eq(FantasyPlayer.playerID, player.playerID),
            eq(FantasyPlayer.stage, i < 17 ? 0 : 1)
          )
        );
    }
  }
  return {};
}
