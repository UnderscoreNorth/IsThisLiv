import {
  and,
  asc,
  avg,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  lte,
  not,
  or,
  sql,
  SQLWrapper,
  sum,
} from "drizzle-orm";
import { db } from "../../db";
import {
  Cup,
  Event,
  Match,
  Performance,
  Player,
  PlayerLink,
  Team,
} from "../../db/schema";
import {
  assistTypes,
  goalTypes,
  goalTypesOG,
  playerLink,
  redCardTypes,
  teamLink,
  yellowCardTypes,
} from "../../lib/helper";
import { Request } from "express";
import { getEvents, getMatches, getPerformances } from "../../db/commonFn";

export async function leaderboards(req: Request) {
  const cupID = parseInt(req.params.cupID);
  const cup = (await db.select().from(Cup).where(eq(Cup.cupID, cupID)))[0];
  if (cup.cupID !== cupID) return {};
  const data: any = {};
  data.mostGoals = await mostEvents(goalTypes);
  data.mostCards = await mostEvents([...yellowCardTypes, ...redCardTypes]);
  data.mostAssists = await mostEvents(assistTypes);
  data.mostSaves = await mostPerf(Performance.saves);
  data.mostMinutes = await mostPerf(
    sql`performance.subOff - performance.subOn`,
    false
  );
  data.mostMotm = await mostPerf(Performance.motm, false);
  data.mostMatchesP = await mostPerf(sql`1`, false);
  const mostMatchesT = await db
    .select({ t: Team.team, c: count() })
    .from(Team)
    .innerJoin(
      Match,
      or(eq(Team.team, Match.homeTeam), eq(Team.team, Match.awayTeam))
    )
    .where(
      and(
        eq(Match.valid, 1),
        eq(Match.official, 1),
        not(eq(Match.winningTeam, "")),
        lte(Match.utcTime, new Date(new Date(cup.end).getTime() + 172800000))
      )
    )
    .groupBy(Team.team)
    .orderBy(desc(count()));
  data.mostMatchesT = mostMatchesT.map((x, i) => {
    return [i + 1, teamLink(x.t, "left"), x.c];
  });
  data.highestCondP = await avgPerf(Performance.cond, desc);
  data.lowestCondP = await avgPerf(Performance.cond, asc);
  data.highestCondT = await avgPerfT(Performance.cond, desc);
  data.highestRateP = await avgPerf(Performance.rating, desc);
  data.lowestRateP = await avgPerf(Performance.rating, asc);
  data.highestRateT = await avgPerfT(Performance.rating, desc);
  let gks: Record<
    number,
    {
      cleanSheets: number;
      wins: number;
      team: string;
      name: string;
      linkID: number;
    }
  > = {};
  let teamCleanSheets: Record<
    string,
    { cleanSheets: number; wins: number; team: string }
  > = {};
  for (const { player, playerlink } of await db
    .select()
    .from(Player)
    .innerJoin(PlayerLink, eq(Player.linkID, PlayerLink.linkID))
    .where(eq(Player.regPos, "GK"))) {
    const matches = await getPerformances({
      playerID: player.playerID,
      end: new Date(new Date(cup.end).getTime() + 172800000),
    });
    if (gks[player.linkID] == undefined) {
      gks[player.linkID] = {
        cleanSheets: 0,
        wins: 0,
        team: player.team,
        name: playerlink.name,
        linkID: player.linkID,
      };
    }
    if (teamCleanSheets[player.team] == undefined) {
      teamCleanSheets[player.team] = {
        cleanSheets: 0,
        wins: 0,
        team: player.team,
      };
    }
    for (const match of matches) {
      const ateam =
        match.match.homeTeam == player.team
          ? match.match.awayTeam
          : match.match.homeTeam;
      const goalsAgainst =
        (
          await getEvents({
            matchID: match.match.matchID,
            eventTypes: goalTypes,
            team: ateam,
          })
        ).length +
        (
          await getEvents({
            matchID: match.match.matchID,
            eventTypes: goalTypesOG,
            team: player.team,
          })
        ).length;
      if (goalsAgainst == 0) {
        gks[player.linkID].cleanSheets++;
        teamCleanSheets[player.team].cleanSheets++;
        if (player.team == match.match.winningTeam) {
          teamCleanSheets[player.team].wins++;
          gks[player.linkID].wins++;
        }
      }
    }
  }
  data.mostCleanP = await Promise.all(
    Object.values(gks)
      .sort((a, b) => {
        if (a.cleanSheets > b.cleanSheets) return -1;
        if (a.cleanSheets < b.cleanSheets) return 1;
        return 0;
      })
      .filter((x, i) => i < 100)
      .map(async (x, i) => {
        return [
          i + 1,
          teamLink(x.team, "left"),
          await playerLink([x.linkID, x.name, x.team]),
          `${x.cleanSheets} (${Math.round((x.wins / x.cleanSheets) * 100)}%)`,
        ];
      })
  );
  data.mostCleanT = Object.values(teamCleanSheets)
    .sort((a, b) => {
      if (a.cleanSheets > b.cleanSheets) return -1;
      if (a.cleanSheets < b.cleanSheets) return 1;
      return 0;
    })
    .filter((x, i) => i < 100)
    .map(async (x, i) => {
      return [
        i + 1,
        teamLink(x.team, "left"),
        `${x.cleanSheets} (${Math.round((x.wins / x.cleanSheets) * 100)}%)`,
      ];
    });
  const matches = await getMatches({
    end: new Date(new Date(cup.end).getTime() + 172800000),
  });
  const teamEff: Record<string, { team: string; wins: number; total: number }> =
    {};
  for (const { match } of matches) {
    for (const team of [match.homeTeam, match.awayTeam]) {
      if (teamEff[team] == undefined)
        teamEff[team] = {
          wins: 0,
          total: 0,
          team,
        };
      if (team == match.winningTeam) teamEff[team].wins++;
      teamEff[team].total++;
    }
  }
  data.highestEff = Object.values(teamEff)
    .sort((a, b) => {
      if (a.wins / a.total > b.wins / b.total) return -1;
      if (a.wins / a.total < b.wins / b.total) return 1;
      return 0;
    })
    .map((x, i) => {
      return [
        i + 1,
        teamLink(x.team, "left"),
        (Math.round((x.wins / x.total) * 10000) / 100)
          .toString()
          .padEnd(3, ".")
          .padEnd(5, "0") + "%",
        x.wins / x.total >= 0.5 ? "N/A" : Math.ceil(x.total - 2 * x.wins),
      ];
    });
  const hatTricks = await db
    .select({ player: Player })
    .from(Event)
    .innerJoin(Match, eq(Event.matchID, Match.matchID))
    .innerJoin(Player, eq(Event.playerID, Player.playerID))
    .where(
      and(
        eq(Match.valid, 1),
        eq(Match.official, 1),
        lte(Match.utcTime, new Date(new Date(cup.end).getTime() + 172800000)),
        inArray(Event.eventType, goalTypes),
        not(eq(Player.name, "Unknown Player")),
        not(isNull(Player.linkID))
      )
    )
    .groupBy(Event.matchID, Player.playerID)
    .having(gte(count(), 3));
  const hatTricksGrouped: Record<string, [number, string, number]> = {};
  for (const row of hatTricks) {
    if (hatTricksGrouped[row.player.linkID] == undefined)
      hatTricksGrouped[row.player.linkID] = [
        row.player.linkID,
        row.player.team,
        0,
      ];
    hatTricksGrouped[row.player.linkID][2]++;
  }
  data.mostHattricks = await Promise.all(
    Object.values(hatTricksGrouped)
      .sort((a, b) => {
        if (a[2] > b[2]) return -1;
        if (a[2] < b[2]) return 1;
        return 0;
      })
      .filter((x, i) => i < 100)
      .map(async (x, i) => {
        return [i + 1, teamLink(x[1], "left"), await playerLink(x[0]), x[2]];
      })
  );
  data.date = new Date();
  return data;
  async function avgPerf(arg: SQLWrapper, dir: typeof asc) {
    const sql = await db
      .select({ PlayerLink, avg: avg(arg), c: count() })
      .from(Performance)
      .innerJoin(Player, eq(Player.playerID, Performance.playerID))
      .innerJoin(PlayerLink, eq(Player.linkID, PlayerLink.linkID))
      .innerJoin(Match, eq(Performance.matchID, Match.matchID))
      .where(
        and(
          eq(Match.valid, 1),
          eq(Match.official, 1),
          lte(Match.utcTime, new Date(new Date(cup.end).getTime() + 172800000)),
          gte(arg, 0)
        )
      )
      .groupBy(PlayerLink.linkID)
      .having(gte(count(), 10))
      .orderBy(dir(avg(arg)))
      .limit(100);
    return await Promise.all(
      sql.map(async (x, i) => {
        const array = [
          i + 1,
          teamLink(x.PlayerLink.team, "left"),
          await playerLink([
            x.PlayerLink.linkID,
            x.PlayerLink.name,
            x.PlayerLink.team,
          ]),
          `${(Math.round(parseFloat(x.avg) * 100) / 100)
            .toString()
            .padEnd(2, ".")
            .padEnd(4, "0")} (${x.c})`,
        ];
        return array;
      })
    );
  }
  async function avgPerfT(arg: SQLWrapper, dir: typeof asc) {
    const sql = await db
      .select({ t: Player.team, avg: avg(arg) })
      .from(Performance)
      .innerJoin(Player, eq(Player.playerID, Performance.playerID))
      .innerJoin(PlayerLink, eq(Player.linkID, PlayerLink.linkID))
      .innerJoin(Match, eq(Performance.matchID, Match.matchID))
      .where(
        and(
          eq(Match.valid, 1),
          eq(Match.official, 1),
          lte(Match.utcTime, new Date(new Date(cup.end).getTime() + 172800000)),
          gte(arg, 0)
        )
      )
      .groupBy(Player.team)
      .orderBy(dir(avg(arg)))
      .limit(100);
    return await Promise.all(
      sql.map(async (x, i) => {
        const array = [
          i + 1,
          teamLink(x.t, "left"),
          `${(Math.round(parseFloat(x.avg) * 100) / 100)
            .toString()
            .padEnd(2, ".")
            .padEnd(4, "0")}`,
        ];
        return array;
      })
    );
  }
  async function mostPerf(sumArg: SQLWrapper, negOne = true) {
    const sql = await db
      .select({ PlayerLink, sum: sum(sumArg) })
      .from(Performance)
      .innerJoin(Player, eq(Player.playerID, Performance.playerID))
      .innerJoin(PlayerLink, eq(Player.linkID, PlayerLink.linkID))
      .innerJoin(Match, eq(Performance.matchID, Match.matchID))
      .where(
        and(
          eq(Match.valid, 1),
          eq(Match.official, 1),
          lte(Match.utcTime, new Date(new Date(cup.end).getTime() + 172800000)),
          negOne === true ? gt(sumArg, 0) : undefined
        )
      )
      .groupBy(PlayerLink.linkID)
      .orderBy(desc(sum(sumArg)))
      .limit(100);
    return await Promise.all(
      sql.map(async (x, i) => {
        const array = [
          i + 1,
          teamLink(x.PlayerLink.team, "left"),
          await playerLink([
            x.PlayerLink.linkID,
            x.PlayerLink.name,
            x.PlayerLink.team,
          ]),
          x.sum,
        ];
        return array;
      })
    );
  }
  async function mostEvents(eType: number[]) {
    const sql = await db
      .select({ PlayerLink, count: count() })
      .from(Event)
      .innerJoin(Player, eq(Player.playerID, Event.playerID))
      .innerJoin(PlayerLink, eq(Player.linkID, PlayerLink.linkID))
      .innerJoin(Match, eq(Event.matchID, Match.matchID))
      .where(
        and(
          eq(Match.valid, 1),
          eq(Match.official, 1),
          inArray(Event.eventType, eType),
          lte(Match.utcTime, new Date(new Date(cup.end).getTime() + 172800000))
        )
      )
      .groupBy(PlayerLink.linkID)
      .orderBy(desc(count()))
      .limit(100);
    return await Promise.all(
      sql.map(async (x, i) => {
        const array = [
          i + 1,
          teamLink(x.PlayerLink.team, "left"),
          await playerLink([
            x.PlayerLink.linkID,
            x.PlayerLink.name,
            x.PlayerLink.team,
          ]),
          x.count,
        ];
        return array;
      })
    );
  }
}
