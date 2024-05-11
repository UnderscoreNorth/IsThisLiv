import { Request } from "express";
import { MatchData } from "./matchDisplay";
import { db } from "../../db";
import {
  Event,
  Match,
  MatchStat,
  Penalty,
  Performance,
  Player,
} from "../../db/schema";
import { and, eq, InferSelectModel, not } from "drizzle-orm";
import { deleteFile } from "../../lib/helper";

export async function matchSave(req: Request) {
  const { data } = req.body as { data: MatchData };
  const currentMatch = (
    await db.select().from(Match).where(eq(Match.matchID, data.matchID))
  )[0];
  if (!currentMatch) return {};
  const dA = (data.date as unknown as string)
    .replace(/-/gm, " ")
    .replace(/:/gm, " ")
    .split(" ");
  await db
    .update(Match)
    .set({
      winningTeam: data.winner,
      round: data.round,
      attendance: data.attendence,
      official: data.off,
      valid: data.valid,
      stadium: data.stadium,
      utcTime: new Date(
        Date.UTC(
          parseInt(dA[0]),
          parseInt(dA[1]) - 1,
          parseInt(dA[2]),
          parseInt(dA[3]),
          parseInt(dA[4])
        )
      ),
    })
    .where(eq(Match.matchID, data.matchID));
  for (const performances of data.performances) {
    for (const p of performances as {
      player: InferSelectModel<typeof Player>;
      performance: InferSelectModel<typeof Performance>;
    }[]) {
      for (let i in p.performance) {
        if (p.performance[i] === "") p.performance[i] = null;
      }
      const perfData = {
        matchID: data.matchID,
        playerID: p.player.playerID,
        subOn: p.performance.subOn ?? -1,
        subOff: p.performance.subOff ?? -1,
        rating: p.performance.rating ?? -1,
        saves: p.performance.saves ?? -1,
        motm: p.player.playerID == data.motm,
        cond: p.performance.cond ?? -1,
        user: "",
      };
      if (p?.performance?.perfID && !p.player.playerID) {
        await db
          .delete(Performance)
          .where(eq(Performance.perfID, p.performance.perfID));
      } else if (p?.performance?.perfID && p.player.playerID) {
        await db
          .update(Performance)
          .set(perfData)
          .where(eq(Performance.perfID, p.performance.perfID));
      } else if (!p?.performance?.perfID && p.player.playerID) {
        for (let i in p.performance) {
          if (p.performance[i] === "") p.performance[i] = null;
        }
        await db.insert(Performance).values(perfData);
      }
    }
  }
  for (const events of data.events) {
    for (const e of events as {
      player: InferSelectModel<typeof Player>;
      event: InferSelectModel<typeof Event>;
    }[]) {
      for (let i in e.event) {
        if (e.event[i] === "") e.event[i] = null;
      }
      const eventData = {
        eventType: e.event.eventType,
        regTime: e.event.regTime ?? -1,
        injTime: e.event.injTime ?? -1,
        playerID: e.player.playerID,
        user: "",
        matchID: data.matchID,
      };
      if (e?.event?.eventID && !e.player.playerID) {
        await db.delete(Event).where(eq(Event.eventID, e.event.eventID));
      } else if (e?.event?.eventID && e.player.playerID) {
        await db
          .update(Event)
          .set(eventData)
          .where(eq(Event.eventID, e.event.eventID));
      } else if (!e?.event?.eventID && e.player.playerID) {
        await db.insert(Event).values(eventData);
      }
    }
  }
  for (const penaltys of data.penalties) {
    for (const e of penaltys as {
      player: InferSelectModel<typeof Player>;
      penalty: InferSelectModel<typeof Penalty>;
    }[]) {
      for (let i in e.penalty) {
        if (e.penalty[i] === "") e.penalty[i] = null;
      }
      const penaltyData = {
        goal: e.penalty.goal,
        playerID: e.player.playerID,
        user: "",
        matchID: data.matchID,
      };
      if (e?.penalty?.penaltyID && !e.player.playerID) {
        await db
          .delete(Penalty)
          .where(eq(Penalty.penaltyID, e.penalty.penaltyID));
      } else if (e?.penalty?.penaltyID && e.player.playerID) {
        await db
          .update(Penalty)
          .set(penaltyData)
          .where(eq(Penalty.penaltyID, e.penalty.penaltyID));
      } else if (!e?.penalty?.penaltyID && e.player.playerID) {
        await db.insert(Penalty).values(penaltyData);
      }
    }
  }
  let finalPeriod = 0;
  for (const period in data.matchStats) {
    for (const teamIndex in data.matchStats[period]) {
      const team =
        teamIndex == "0" ? currentMatch.homeTeam : currentMatch.awayTeam;
      const statObj: InferSelectModel<typeof MatchStat> = {
        matchID: data.matchID,
        team: team,
        statID: -1,
        poss: -1,
        shots: -1,
        shotsOT: -1,
        fouls: -1,
        offsides: -1,
        corners: -1,
        freeKicks: -1,
        passComp: -1,
        passTot: -1,
        passMade: -1,
        crosses: -1,
        interceptions: -1,
        tackles: -1,
        saves: -1,
        period: parseInt(period) + 1,
        home: teamIndex == "0" ? true : false,
        finalPeriod: false,
      };
      if (statObj.passMade >= 0 && statObj.passTot > 0) {
        statObj.passComp = statObj.passMade / statObj.passTot;
      }
      let isBlank = true;
      for (const stat of data.matchStats[period][teamIndex]) {
        if (stat.value !== undefined && stat.value !== "")
          statObj[stat.sql] = stat.value;
        if (
          !["statID", "passMade", "passTot"].includes(stat.sql) &&
          stat.value !== undefined &&
          stat.value !== ""
        ) {
          isBlank = false;
        }
      }
      if (!isBlank && parseInt(period) + 1 > finalPeriod)
        finalPeriod = parseInt(period) + 1;
      if (isBlank && statObj.statID) {
        await db.delete(MatchStat).where(eq(MatchStat.statID, statObj.statID));
      } else if (!isBlank && statObj.statID > 0) {
        await db
          .update(MatchStat)
          .set(statObj)
          .where(eq(MatchStat.statID, statObj.statID));
      } else if (!isBlank && statObj.statID == -1) {
        delete statObj.statID;
        await db.insert(MatchStat).values(statObj);
      }
    }
  }
  if (finalPeriod > 0) {
    await db
      .update(MatchStat)
      .set({ finalPeriod: true })
      .where(
        and(
          eq(MatchStat.matchID, data.matchID),
          eq(MatchStat.period, finalPeriod)
        )
      );
    await db
      .update(MatchStat)
      .set({ finalPeriod: false })
      .where(
        and(
          eq(MatchStat.matchID, data.matchID),
          not(eq(MatchStat.period, finalPeriod))
        )
      );
  }
  await deleteFile(data.cupID, "cups");
  return {};
}
