import { Request } from "express";
import { db } from "../../db";
import { Cup, Event, Match, Performance, Player, Team } from "../../db/schema";
import {
  and,
  Column,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  lte,
  not,
  sum,
} from "drizzle-orm";
import { assistTypes, cupLink, goalTypes } from "../../lib/helper";
import { int, mysqlTable } from "drizzle-orm/mysql-core";

export async function getMaintenance(req: Request) {
  let data: Record<
    string,
    { type: "cupTeam" | "match" | ""; headers: string[]; rows: any[][] }
  > = {};
  const missingStartings = await db
    .select({ cupID: Cup.cupID, team: Player.team, cupName: Cup.cupName })
    .from(Cup)
    .innerJoin(Player, eq(Player.cupID, Cup.cupID))
    .where(and(lte(Cup.cupType, 3), gte(Cup.year, 2013)))
    .groupBy(Cup.cupID, Player.team)
    .having(lt(sum(Player.starting), 11))
    .orderBy(desc(Cup.end));
  if (missingStartings.length) {
    data["Missing Starting Lineup"] = {
      type: "cupTeam",
      headers: ["Team", "Cup"],
      rows: missingStartings.map((x) => {
        return [{ team: x.team, cupID: x.cupID }, x.team, x.cupName];
      }),
    };
  }
  const eventsWithoutPerf = await db
    .select({ player: Player, cup: Cup, match: Match })
    .from(Event)
    .innerJoin(Match, eq(Event.matchID, Match.matchID))
    .innerJoin(Player, eq(Player.playerID, Event.playerID))
    .innerJoin(Cup, eq(Match.cupID, Cup.cupID))
    .leftJoin(
      Performance,
      and(
        eq(Event.matchID, Performance.matchID),
        eq(Event.playerID, Performance.playerID)
      )
    )
    .where(
      and(isNull(Performance.matchID), not(eq(Player.name, "Unknown Player")))
    )
    .groupBy(Player.playerID, Cup.cupID, Match.matchID)
    .orderBy(desc(Match.utcTime));
  if (eventsWithoutPerf.length) {
    data["Events Missing Performance"] = {
      type: "match",
      headers: ["Team", "Player", "Cup", "Match"],
      rows: eventsWithoutPerf.map((x) => {
        return [
          x.match.matchID,
          x.player.team,
          x.player.name,
          x.cup.cupName,
          x.match.round,
        ];
      }),
    };
  }
  const goals = mysqlTable("goals", {
    eventID: int("eventID").primaryKey().autoincrement(),
    matchID: int("matchID"),
    playerID: int("playerID"),
    eventType: int("eventType"),
    regTime: int("regTime"),
    injTime: int("injTime"),
  });
  const assistsWithoutGoals = await db
    .select({ player: Player, cup: Cup, match: Match })
    .from(Event)
    .innerJoin(Match, eq(Event.matchID, Match.matchID))
    .innerJoin(Player, eq(Player.playerID, Event.playerID))
    .innerJoin(Cup, eq(Match.cupID, Cup.cupID))
    .leftJoin(
      db
        .select()
        .from(Event)
        .where(inArray(Event.eventType, goalTypes))
        .as("goals"),
      and(
        eq(goals.regTime, Event.regTime),
        eq(goals.injTime, Event.injTime),
        eq(goals.matchID, Event.matchID)
      )
    )
    .where(
      and(
        isNull(goals.matchID),
        not(eq(Player.name, "Unknown Player")),
        inArray(Event.eventType, assistTypes)
      )
    )
    .orderBy(desc(Match.utcTime));
  if (assistsWithoutGoals.length) {
    data["Assists without Goals"] = {
      type: "match",
      headers: ["Team", "Player", "Cup", "Match"],
      rows: assistsWithoutGoals.map((x) => {
        return [
          x.match.matchID,
          x.player.team,
          x.player.name,
          x.cup.cupName,
          x.match.round,
        ];
      }),
    };
  }

  return { data };
}
