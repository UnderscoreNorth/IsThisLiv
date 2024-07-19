import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  like,
  lte,
  or,
  sum,
} from "drizzle-orm";
import { db } from ".";
import {
  Cup,
  Event,
  Match,
  Penalty,
  Performance,
  Player,
  PlayerLink,
  RosterOrder,
  Round,
} from "./schema";
import { union } from "drizzle-orm/mysql-core";
import { assistTypes, goalTypes } from "../lib/helper";
export async function getCup(id: number) {
  return await db.query.Cup.findFirst({
    where: (c, { eq }) => eq(c.cupID, id),
  });
}
export async function getCupTeams(id: number) {
  return (
    await union(
      db
        .selectDistinct({ team: Match.homeTeam })
        .from(Match)
        .where(and(eq(Match.cupID, id), eq(Match.official, 1))),
      db
        .selectDistinct({ team: Match.awayTeam })
        .from(Match)
        .where(and(eq(Match.cupID, id), eq(Match.official, 1)))
    )
  ).map((x) => x.team);
}
export async function getCups(options?: {
  excludeFriendlies?: boolean;
  cupList?: number[];
  asc?: boolean;
}) {
  const where = and(
    options?.excludeFriendlies == true
      ? lte(Cup.cupType, 3)
      : lte(Cup.cupType, 4),
    options?.cupList ? inArray(Cup.cupID, options.cupList) : undefined
  );
  return await db
    .select()
    .from(Cup)
    .where(where)
    .orderBy(options?.asc == true ? asc(Cup.start) : desc(Cup.start));
}

export async function getMatches(options?: {
  getVoided?: boolean;
  getUnofficial?: boolean;
  sort?: "asc" | "desc";
  roundSort?: "asc" | "desc";
  team?: string;
  cupID?: number;
  matchID?: number;
  start?: Date;
  end?: Date;
}) {
  return db
    .select()
    .from(Match)
    .innerJoin(Round, eq(Match.round, Round.round))
    .innerJoin(Cup, eq(Match.cupID, Cup.cupID))
    .where(
      and(
        options?.cupID ? eq(Match.cupID, options.cupID) : undefined,
        options?.getVoided ? undefined : eq(Match.valid, 1),
        options?.getUnofficial ? undefined : eq(Match.official, 1),
        options?.team
          ? or(
              eq(Match.homeTeam, options.team),
              eq(Match.awayTeam, options.team)
            )
          : undefined,
        options?.matchID ? eq(Match.matchID, options.matchID) : undefined,
        options?.start ? gte(Match.utcTime, options.start) : undefined,
        options?.end ? lte(Match.utcTime, options.end) : undefined
      )
    )
    .orderBy(
      Cup.start,
      options?.roundSort == "desc" ? desc(Round.order) : asc(Round.order),
      Round.round,
      options?.sort == "desc" ? desc(Match.utcTime) : asc(Match.utcTime),
      Match.matchID
    );
}

export async function getEvents(options: {
  cupID?: number;
  matchID?: number;
  eventTypes?: number[];
  getVoided?: boolean;
  linkID?: number;
  team?: string;
}) {
  const where = and(
    options.getVoided ? undefined : eq(Match.valid, 1),
    options.eventTypes
      ? inArray(Event.eventType, options.eventTypes)
      : undefined,
    options.cupID ? eq(Match.cupID, options.cupID) : undefined,
    options.matchID ? eq(Match.matchID, options.matchID) : undefined,
    options.linkID ? eq(Player.linkID, options.linkID) : undefined,
    options?.team ? eq(Player.team, options.team) : undefined
  );

  return await db
    .select()
    .from(Event)
    .innerJoin(Match, eq(Event.matchID, Match.matchID))
    .innerJoin(Player, eq(Event.playerID, Player.playerID))
    .where(where)
    .orderBy(Event.regTime, Event.injTime, Event.eventType);
}
export async function getPerformances(options: {
  cupID?: number;
  matchID?: number;
  getVoided?: boolean;
  team?: string;
  getFriendlies?: boolean;
  linkID?: number;
  playerID?: number;
  motm?: boolean;
  end?: Date;
}) {
  const where = and(
    options.getVoided ? undefined : eq(Match.valid, 1),
    options.cupID ? eq(Match.cupID, options.cupID) : undefined,
    options.matchID ? eq(Match.matchID, options.matchID) : undefined,
    options.team ? eq(Player.team, options.team) : undefined,
    options.getFriendlies ? undefined : lte(Cup.cupType, 3),
    options.linkID ? eq(Player.linkID, options.linkID) : undefined,
    options.playerID ? eq(Player.playerID, options.playerID) : undefined,
    options.motm ? eq(Performance.motm, options.motm) : undefined,
    options?.end ? lte(Match.utcTime, options.end) : undefined
  );
  return await db
    .select()
    .from(Performance)
    .innerJoin(Match, eq(Performance.matchID, Match.matchID))
    .innerJoin(Player, eq(Performance.playerID, Player.playerID))
    .innerJoin(Cup, eq(Match.cupID, Cup.cupID))
    .where(where)
    .orderBy(Match.utcTime, Performance.subOn, Performance.perfID);
}

export async function getPlayers(options: {
  cupID?: number;
  team?: string;
  getFriendlies?: boolean;
  linkID?: number | null;
  playerID?: number | null;
  like?: string;
}) {
  const where = and(
    options.cupID ? eq(Player.cupID, options.cupID) : undefined,
    options.team ? eq(Player.team, options.team) : undefined,
    options.getFriendlies ? undefined : lte(Cup.cupType, 3),
    options.linkID ? eq(Player.linkID, options.linkID) : undefined,
    options.like
      ? or(like(Player.name, options.like), like(PlayerLink.name, options.like))
      : undefined,
    options.playerID ? eq(Player.playerID, options.playerID) : undefined
  );

  return await db
    .select()
    .from(Player)
    .innerJoin(Cup, eq(Player.cupID, Cup.cupID))
    .leftJoin(RosterOrder, eq(Player.regPos, RosterOrder.pos))
    .leftJoin(PlayerLink, eq(Player.linkID, PlayerLink.linkID))
    .where(where)
    .orderBy(Player.cupID, Player.name);
}

export async function getMost(
  type: "goals" | "assists" | "saves",
  cupID: number
) {
  if (type == "goals" || type == "assists") {
    const eventTypes = type == "goals" ? goalTypes : assistTypes;
    return await db
      .select({
        linkID: Player.linkID,
        count: count(),
      })
      .from(Event)
      .innerJoin(Match, eq(Event.matchID, Match.matchID))
      .innerJoin(Player, eq(Event.playerID, Player.playerID))
      .where(
        and(
          eq(Match.cupID, cupID),
          gt(Player.linkID, 0),
          inArray(Event.eventType, eventTypes),
          eq(Match.valid, 1),
          eq(Match.official, 1)
        )
      )
      .groupBy(Player.linkID)
      .orderBy(({ count }) => desc(count))
      .limit(1);
  } else {
    return await db
      .select({
        linkID: Player.linkID,
        count: sum(Performance.saves),
      })
      .from(Performance)
      .innerJoin(Match, eq(Performance.matchID, Match.matchID))
      .innerJoin(Player, eq(Performance.playerID, Player.playerID))
      .where(
        and(
          eq(Match.cupID, cupID),
          gt(Player.linkID, 0),
          gt(Performance.saves, 0),
          eq(Match.valid, 1),
          eq(Match.official, 1)
        )
      )
      .groupBy(Player.linkID)
      .orderBy(({ count }) => desc(count))
      .limit(1);
  }
}
export async function getPenalties(options: {
  cupID?: number;
  matchID?: number;
  getVoided?: boolean;
  linkID?: number;
  team?: string;
}) {
  const where = and(
    options.getVoided ? undefined : eq(Match.valid, 1),
    options.cupID ? eq(Match.cupID, options.cupID) : undefined,
    options.matchID ? eq(Match.matchID, options.matchID) : undefined,
    options.linkID ? eq(Player.linkID, options.linkID) : undefined,
    options?.team ? eq(Player.team, options.team) : undefined
  );

  return await db
    .select()
    .from(Penalty)
    .innerJoin(Match, eq(Penalty.matchID, Match.matchID))
    .innerJoin(Player, eq(Penalty.playerID, Player.playerID))
    .where(where)
    .orderBy(Penalty.penaltyID);
}
export async function getUser(name: string, hash: string) {}
