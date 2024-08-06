import { Request } from "express";
import {
  getEvents,
  getMatches,
  getPenalties,
  getPerformances,
  getPlayers,
} from "../../db/commonFn";
import { db } from "../../db";
import {
  Cup,
  EventType,
  Match,
  MatchStat,
  Player,
  PlayerLink,
  RosterOrder,
  Round,
} from "../../db/schema";
import {
  and,
  desc,
  eq,
  InferInsertModel,
  InferSelectModel,
  lt,
  lte,
  not,
  or,
} from "drizzle-orm";
import { goalTypes, goalTypesOG } from "../../lib/helper";

export async function matchHistory(req: Request) {
  let matchID = parseInt(req.params.matchID);
  let matchData = (
    await getMatches({ matchID, getUnofficial: true, getVoided: true })
  )[0].match;
  let matches: Array<{
    match: InferSelectModel<typeof Match> & {
      homeGoals?: number;
      awayGoals?: number;
    };
    cup: InferSelectModel<typeof Cup>;
  }> = await db
    .select()
    .from(Match)
    .innerJoin(Cup, eq(Match.cupID, Cup.cupID))
    .where(
      and(
        or(
          eq(Match.homeTeam, matchData.homeTeam),
          eq(Match.awayTeam, matchData.homeTeam)
        ),
        or(
          eq(Match.homeTeam, matchData.awayTeam),
          eq(Match.awayTeam, matchData.awayTeam)
        ),
        lt(Match.utcTime, matchData.utcTime)
      )
    )
    .orderBy(desc(Match.utcTime));
  for (const match of matches) {
    match.match.homeTeam = matchData.homeTeam;
    match.match.awayTeam = matchData.awayTeam;
    match.match.homeGoals = 0;
    match.match.awayGoals = 0;
    let events = await getEvents({
      matchID: match.match.matchID,
      getVoided: true,
    });
    for (const event of events) {
      if (goalTypes.includes(event.event.eventType)) {
        event.player.team == match.match.homeTeam
          ? match.match.homeGoals++
          : match.match.awayGoals++;
      } else if (goalTypesOG.includes(event.event.eventType)) {
        event.player.team !== match.match.homeTeam
          ? match.match.homeGoals++
          : match.match.awayGoals++;
      }
    }
  }
  let data = {};
  data.matches = matches;
  return data;
}
