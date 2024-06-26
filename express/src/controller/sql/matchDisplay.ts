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
  EventType,
  Match,
  MatchStat,
  Player,
  PlayerLink,
  RosterOrder,
  Round,
} from "../../db/schema";
import { eq, InferInsertModel } from "drizzle-orm";

export type MatchData = {
  home: string;
  away: string;
  winner: string;
  round: string;
  date: Date;
  cupID: number;
  attendence: number;
  version: number;
  stadium: string;
  off: number;
  valid: number;
  rounds: string[];
  stadiums: string[];
  eventType: Record<number, string>;
  matchStats: { sql: string; name: string; value: number }[][][];
  players: [
    {
      player: InferInsertModel<typeof Player>;
      rosterOrder: InferInsertModel<typeof RosterOrder>;
      playerlink: InferInsertModel<typeof PlayerLink>;
    }[],
    {
      player: InferInsertModel<typeof Player>;
      rosterOrder: InferInsertModel<typeof RosterOrder>;
      playerlink: InferInsertModel<typeof PlayerLink>;
    }[]
  ];
  performances: [[], []];
  events: [[], []];
  penalties: [[], []];
  teams: [];
  matchID?: number;
  motm?: number;
};

export async function matchDisplay(req: Request) {
  let matchID = parseInt(req.params.matchID);
  let matchData = (
    await getMatches({ matchID, getUnofficial: true, getVoided: true })
  )[0];
  let matchMeta = matchData.match;
  let cupID = matchData.cup.cupID;
  let data: MatchData = {
    home: matchMeta.homeTeam,
    away: matchMeta.awayTeam,
    winner: matchMeta.winningTeam,
    round: matchMeta.round,
    date: matchMeta.utcTime,
    cupID: matchMeta.cupID,
    attendence: matchMeta.attendance,
    version: matchData.cup.pes,
    stadium: matchMeta.stadium,
    off: matchMeta.official,
    valid: matchMeta.valid,
    rounds: [],
    stadiums: [],
    eventType: {},
    matchStats: [[], [], []],
    players: [[], []],
    performances: [[], []],
    events: [[], []],
    penalties: [[], []],
    teams: [],
  };
  let teams = [data.home, data.away];

  for (const e of await db.select().from(EventType)) {
    data.eventType[e.eventType] = e.description;
  }
  data.rounds = (await db.select().from(Round)).map((x) => x.round);
  data.stadiums = (
    await db
      .selectDistinct({ stadium: Match.stadium })
      .from(Match)
      .where(eq(Match.cupID, matchMeta.cupID))
  ).map((x) => x.stadium);

  const sql = await db
    .select()
    .from(MatchStat)
    .where(eq(MatchStat.matchID, matchID))
    .orderBy(MatchStat.period, MatchStat.home);
  for (let i in sql) {
    data.matchStats[sql[i].period - 1][sql[i].home ? 0 : 1] = formatStats(
      sql[i]
    );
  }
  for (let p = 0; p <= 2; p++) {
    if (!data.matchStats[p].length) {
      data.matchStats[p] = [formatStats(), formatStats()];
    }
  }

  for (let i in teams) {
    let team = teams[i];
    data.players[i] = (
      await getPlayers({ cupID, team, getFriendlies: true })
    ).map((x) => {
      delete x.cup;
      delete x.playerlink;
      return x;
    });
    data.performances[i] = await getPerformances({
      cupID,
      team,
      matchID,
      getFriendlies: true,
      getVoided: true,
    });
    data.events[i] = await getEvents({ cupID, team, matchID, getVoided: true });
    data.penalties[i] = await getPenalties({
      cupID,
      team,
      matchID,
      getVoided: true,
    });
  }
  for (let i of data.performances) {
    for (let j of i) {
      if (j.performance.motm) {
        data.motm = j.player.playerID;
      }
    }
  }
  teams = [""].concat(teams);
  teams.push("draw");
  data.teams = teams;
  return data;
}
function formatStats(obj: Record<string, number> = {}) {
  return [
    { sql: "statID", name: "SQL ID", value: obj.statID },
    { sql: "poss", name: "Posession (%)", value: obj.poss },
    { sql: "shots", name: "Shots", value: obj.shots },
    { sql: "shotsOT", name: "(on target)", value: obj.shotsOT },
    { sql: "fouls", name: "Fouls", value: obj.fouls },
    { sql: "offsides", name: "(offside)", value: obj.offsides },
    { sql: "corners", name: "Corner Kicks", value: obj.corners },
    { sql: "freeKicks", name: "Free Kicks", value: obj.freeKicks },
    {
      sql: "passComp",
      name: "Pass completed (%)",
      value: obj.passComp,
    },
    { sql: "passTot", name: "Passes", value: obj.passTot },
    { sql: "passMade", name: "(Made)", value: obj.passMade },
    { sql: "crosses", name: "Crosses", value: obj.crosses },
    {
      sql: "interceptions",
      name: "Interceptions",
      value: obj.interceptions,
    },
    { sql: "tackles", name: "Tackles", value: obj.tackles },
    { sql: "saves", name: "Saves", value: obj.saves },
  ];
}
