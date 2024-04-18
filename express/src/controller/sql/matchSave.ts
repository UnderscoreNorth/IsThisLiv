import { Request } from "express";
import { MatchData } from "./matchDisplay";
import { db } from "../../db";
import { Event, Match, Penalty, Performance, Player } from "../../db/schema";
import { eq, InferSelectModel } from "drizzle-orm";
import { deleteFile } from "../../lib/helper";

export async function matchSave(req: Request) {
  const { data } = req.body as { data: MatchData };
  await db
    .update(Match)
    .set({
      winningTeam: data.winner,
      round: data.round,
      attendance: data.attendence,
      official: data.off,
      valid: data.valid,
      stadium: data.stadium,
      utcTime: new Date(data.date),
    })
    .where(eq(Match.matchID, data.matchID));
  for (const performances of data.performances) {
    for (const p of performances as {
      player: InferSelectModel<typeof Player>;
      performance: InferSelectModel<typeof Performance>;
    }[]) {
      for (let i in p.performance) {
        if (p.performance[i] == "") p.performance[i] = null;
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
          if (p.performance[i] == "") p.performance[i] = null;
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
        if (e.event[i] == "") e.event[i] = null;
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
        if (e.penalty[i] == "") e.penalty[i] = null;
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
  await deleteFile(data.cupID, "Cup");
  return {};
}
