import { Request } from "express";
import {
  assistTypes,
  formatEventTime,
  goalTypes,
  playerLink,
  redCardTypes,
  teamLink,
  yellowCardTypes,
} from "../../lib/helper";
import fs from "fs/promises";
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
  InferSelectModel,
  isNotNull,
  lte,
  max,
  min,
  not,
  sql,
  SQL,
  SQLWrapper,
  sum,
} from "drizzle-orm";
import {
  Cup,
  Event,
  Match,
  MatchStat,
  Performance,
  Player,
  PlayerLink,
} from "../../db/schema";
import { db } from "../../db";
import { getCup, getCups, getPlayers } from "../../db/commonFn";
import { MySqlColumn } from "drizzle-orm/mysql-core";

const recordTypes = [
  "match-team",
  "match-individual",
  "match-day",
  "match-match",
] as const;

export async function mainRecords(req: Request) {
  const url = req.baseUrl.toLowerCase();
  let date = new Date();
  date.setDate(date.getDate() + 1);
  if (url.includes("match-individual")) {
    return await calcRecords(["match-individual"], date);
  } else if (url.includes("match-team")) {
    return await calcRecords(["match-team"], date);
  } else if (url.includes("match-day")) {
    return await calcRecords(["match-day"], date);
  } else if (url.includes("match-match")) {
    return await calcRecords(["match-match"], date);
  }
}
export async function cupRecords(req: Request) {
  const cupID = parseInt(req.params.cupID);
  const cup = await getCup(cupID);
  if (!cup?.cupName) return {};
  const date = new Date(cup.end);
  date.setDate(date.getDate() + 1);
  return await calcRecords([...recordTypes], date, cup.cupID);
}
export async function calcAllCups() {
  const cups = await getCups({ excludeFriendlies: true, asc: true });
  for (const cup of cups) {
    let date = new Date(cup.end);
    date.setDate(date.getDate() + 1);
    const data = await calcRecords([...recordTypes], date, cup.cupID);
    await fs.writeFile(
      "cache/__api__records__cups__" + cup.cupID + ".json",
      JSON.stringify(data)
    );
    console.log(cup.cupName + " records rebuilt");
  }
  return {};
}

async function calcRecords(
  types: Array<(typeof recordTypes)[number]>,
  date: Date,
  cupID?: number
) {
  let data: Record<
    string,
    Record<
      string,
      {
        header: Array<{ header: string; colspan?: number }>;
        rows: Array<Array<string | number>>;
        numbered: boolean;
      }
    >
  > = {};
  if (types.includes("match-individual")) {
    const title = "Match - Individual";
    data[title] = {};
    data[title]["Most Goals Scored"] = await indEvent({
      eventTypes: goalTypes,
      date,
      cupID,
    });
    data[title]["Most Goals Scored In the First Half"] = await indEvent({
      eventTypes: goalTypes,
      date,
      cupID,
      wheres: lte(Event.regTime, 45),
    });
    data[title]["Most Goals Scored In the Second Half"] = await indEvent({
      eventTypes: goalTypes,
      date,
      cupID,
      wheres: and(lte(Event.regTime, 90), gt(Event.regTime, 45)),
    });
    data[title]["Most Goals Scored In Extra Time"] = await indEvent({
      eventTypes: goalTypes,
      date,
      cupID,
      wheres: gte(Event.regTime, 90),
    });
    data[title]["Most Assists"] = await indEvent({
      eventTypes: assistTypes,
      date,
      cupID,
    });
    data[title]["Most Saves"] = await indPerf({
      stat: sum(Performance.saves),
      dir: desc,
      date,
      cupID,
      wheres: gt(Performance.saves, 0),
    });
    data[title]["Highest Rating"] = await indPerf({
      stat: max(Performance.rating),
      dir: desc,
      date,
      cupID,
    });
    data[title]["Quickest Brace"] = await hatTrick({ num: 2, date, cupID });
    data[title]["Quickest Hat Trick"] = await hatTrick({ num: 3, date, cupID });
    data[title]["Quickest Double Brace"] = await hatTrick({
      num: 4,
      date,
      cupID,
    });
    data[title]["Quickest Glut"] = await hatTrick({ num: 5, date, cupID });
  }
  if (types.includes("match-team")) {
    const title = "Match - Team";
    data[title] = {};
    data[title]["Most Shots"] = await teamStat({
      stat: max(MatchStat.shots),
      date,
      cupID,
    });
    data[title]["Most Shots on Target"] = await teamStat({
      stat: max(MatchStat.shotsOT),
      date,
      cupID,
    });
    data[title]["Most Shots all on Target"] = await teamStat({
      stat: max(MatchStat.shotsOT),
      date,
      where: eq(MatchStat.shots, MatchStat.shotsOT),
      cupID,
    });
    data[title]["Most Fouls"] = await teamStat({
      cupID,
      stat: max(MatchStat.fouls),
      date,
    });
    data[title]["Most Offsides"] = await teamStat({
      cupID,
      stat: max(MatchStat.offsides),
      date,
    });
    data[title]["Most Free Kicks"] = await teamStat({
      cupID,
      stat: max(MatchStat.freeKicks),
      date,
    });
    data[title]["Most Passes Made (Pes18+)"] = await teamStat({
      cupID,
      stat: max(MatchStat.passMade),
      date,
    });
    data[title]["Most Crosses"] = await teamStat({
      cupID,
      stat: max(MatchStat.crosses),
      date,
    });
    data[title]["Most Interceptions"] = await teamStat({
      cupID,
      stat: max(MatchStat.interceptions),
      date,
    });
    data[title]["Most Tackles"] = await teamStat({
      cupID,
      stat: max(MatchStat.tackles),
      date,
    });
    data[title]["Most Saves"] = await teamStat({
      cupID,
      stat: max(MatchStat.saves),
      date,
    });
    data[title]["Highest Avg Rating"] = await teamPerf({
      cupID,
      stat: Performance.rating,
      dir: desc,
      date,
    });
    data[title]["Lowest Avg Rating"] = await teamPerf({
      cupID,
      stat: Performance.rating,
      dir: asc,
      date,
    });
    data[title]["Highest Avg Condition"] = await teamPerf({
      cupID,
      stat: Performance.cond,
      dir: desc,
      date,
    });
    data[title]["Lowest Avg Condition"] = await teamPerf({
      cupID,
      stat: Performance.cond,
      dir: asc,
      date,
    });
  }
  if (types.includes("match-day")) {
    const title = "Match - Day";
    data[title] = {};
    data[title]["Most Shots"] = await dayMatchStat({
      stat: sum(MatchStat.shots),
      dir: desc,
      cupID,
      date,
    });
    data[title]["Least Shots"] = await dayMatchStat({
      stat: sum(MatchStat.shots),
      dir: asc,
      cupID,
      date,
    });
    data[title]["Most Shots On Target"] = await dayMatchStat({
      stat: sum(MatchStat.shotsOT),
      dir: desc,
      cupID,
      date,
    });
    data[title]["Least Shots On Target"] = await dayMatchStat({
      stat: sum(MatchStat.shotsOT),
      dir: asc,
      cupID,
      date,
    });
    data[title]["Most Fouls"] = await dayMatchStat({
      stat: sum(MatchStat.fouls),
      dir: desc,
      cupID,
      date,
    });
    data[title]["Least Fouls"] = await dayMatchStat({
      stat: sum(MatchStat.fouls),
      dir: asc,
      cupID,
      date,
    });
    data[title]["Most Offsides"] = await dayMatchStat({
      stat: sum(MatchStat.offsides),
      dir: desc,
      cupID,
      date,
    });
    data[title]["Least Offsides"] = await dayMatchStat({
      stat: sum(MatchStat.offsides),
      dir: asc,
      cupID,
      date,
    });
    data[title]["Most Free Kicks"] = await dayMatchStat({
      stat: sum(MatchStat.freeKicks),
      dir: desc,
      cupID,
      date,
    });
    data[title]["Least Free Kicks"] = await dayMatchStat({
      stat: sum(MatchStat.freeKicks),
      dir: asc,
      cupID,
      date,
    });
    data[title]["Most Passes Made (Pes18+)"] = await dayMatchStat({
      stat: sum(MatchStat.passMade),
      dir: desc,
      cupID,
      date,
    });
    data[title]["Most Crosses"] = await dayMatchStat({
      stat: sum(MatchStat.crosses),
      dir: desc,
      cupID,
      date,
    });
    data[title]["Least Crosses"] = await dayMatchStat({
      stat: sum(MatchStat.crosses),
      dir: asc,
      cupID,
      date,
    });
    data[title]["Most Interceptions"] = await dayMatchStat({
      stat: sum(MatchStat.interceptions),
      dir: desc,
      cupID,
      date,
    });
    data[title]["Least Interceptions"] = await dayMatchStat({
      stat: sum(MatchStat.interceptions),
      dir: asc,
      cupID,
      date,
    });
    data[title]["Most Tackles"] = await dayMatchStat({
      stat: sum(MatchStat.tackles),
      dir: desc,
      cupID,
      date,
    });
    data[title]["Least Tackles"] = await dayMatchStat({
      stat: sum(MatchStat.tackles),
      dir: asc,
      cupID,
      date,
    });
    data[title]["Most Saves"] = await dayMatchStat({
      stat: sum(MatchStat.saves),
      dir: desc,
      cupID,
      date,
    });
    data[title]["Least Saves"] = await dayMatchStat({
      stat: sum(MatchStat.saves),
      dir: asc,
      cupID,
      date,
    });
    data[title]["Most Cards"] = await dayEvent({
      eventType: [...yellowCardTypes, ...redCardTypes],
      cupID,
      date,
      dir: desc,
    });
    data[title]["Most Goals"] = await dayEvent({
      eventType: goalTypes,
      cupID,
      date,
      dir: desc,
    });
    data[title]["Least Goals"] = await dayEvent({
      eventType: goalTypes,
      cupID,
      date,
      dir: asc,
    });
  }
  if (types.includes("match-match")) {
    const title = "Match - Day";
    data[title] = {};
    const matchStatShort = async (
      statTitle: string,
      stat: MySqlColumn,
      both = false
    ) => {
      data[title][`Most ${statTitle}`] = await matchStat({
        cupID,
        date,
        dir: desc,
        stat: sum(stat),
      });
      if (both)
        data[title][`Least ${statTitle}`] = await matchStat({
          cupID,
          date,
          dir: asc,
          stat: sum(stat),
        });
    };
    await matchStatShort("Shots", MatchStat.shots, true);
    await matchStatShort("Shots on Target", MatchStat.shotsOT, true);
    await matchStatShort("Fouls", MatchStat.fouls);
    await matchStatShort("Offsides", MatchStat.offsides);
    await matchStatShort("Free Kicks", MatchStat.freeKicks);
    await matchStatShort("Passes Made (Pes18+)", MatchStat.passMade);
    await matchStatShort("Crosses", MatchStat.crosses);
    await matchStatShort("Interceptions", MatchStat.interceptions);
    await matchStatShort("Tackles", MatchStat.tackles);
    await matchStatShort("Saves", MatchStat.saves);
  }
  for (let k in data) {
    for (let j in data[k]) {
      if (!data[k][j].rows.length) delete data[k][j];
    }
    if (!Object.keys(data[k]).length) delete data[k];
  }
  return {
    data,
    date: new Date(),
  };
}

async function matchStat({
  stat,
  date,
  dir,
  cupID,
}: {
  stat: SQL<string | number>;
  date: Date;
  dir: typeof desc;
  cupID?: number;
}) {
  let result = await db
    .select({
      home: Match.homeTeam,
      away: Match.awayTeam,
      cup: Cup.cupName,
      round: Match.round,
      sum: stat,
      date: Match.utcTime,
      row: Match.round,
      cupID: Match.cupID,
    })
    .from(MatchStat)
    .innerJoin(Match, eq(Match.matchID, MatchStat.matchID))
    .innerJoin(Cup, eq(Cup.cupID, Match.cupID))
    .where(
      and(
        eq(Match.valid, 1),
        eq(Match.official, 1),
        eq(MatchStat.finalPeriod, true),
        lte(Cup.end, date)
      )
    )
    .groupBy(Match.matchID)
    .orderBy(dir(stat), desc(Match.utcTime))
    .limit(25);
  result = placeMaker(result, "sum");
  return {
    header: getHeaders(
      [{ header: "Record" }, { header: "Match", colspan: 3 }],
      cupID
    ),
    rows: result
      .filter((x) => x.cupID == cupID || !cupID)
      .map((x) => [
        ...(cupID ? [x.row] : []),
        ...[
          x.sum,
          `${!cupID ? x.cup + " " : ""}${x.round}`,
          `${teamLink(x.home)} - ${teamLink(x.away)}`,
        ],
      ]),
    numbered: false,
  };
}

async function dayEvent({
  eventType,
  dir,
  cupID,
  date,
}: {
  eventType: number[];
  dir: typeof desc;
  cupID?: number;
  date: Date;
}) {
  let customDate = sql`DATE(utcTime)`;
  let customSum = sql<number>`SUM(CASE WHEN Event.eventType IN (${eventType.join(
    ","
  )}) THEN 1 ELSE 0 END)`;
  let customCount = sql<number>`COUNT(DISTINCT(Match.matchID))`;
  let result = await db
    .select({
      cup: min(Cup.cupName),
      cupID: min(Cup.cupID),
      count: customCount,
      sum: customSum,
      row: sql<number>`0`,
      date: customDate,
      day: sql<number>`0`,
    })
    .from(Match)
    .where(and(eq(Match.valid, 1), eq(Match.official, 1), lte(Cup.end, date)))
    .innerJoin(Cup, eq(Match.cupID, Cup.cupID))
    .leftJoin(Event, eq(Event.matchID, Match.matchID))
    .groupBy(customDate)
    .orderBy(dir(customSum), desc(customDate))
    .limit(25);
  result = placeMaker(result, "count");
  for (let row of result) {
    row.day =
      (
        await db
          .select({ date: customDate })
          .from(Match)
          .where(eq(Match.cupID, row.cupID))
          .groupBy(customDate)
          .orderBy(customDate)
      )
        .map((x) => x.date)
        .indexOf(row.date) + 1;
  }
  return {
    header: getHeaders(
      [{ header: "Per Match" }, { header: "Total" }, { header: "Day" }],
      cupID
    ),
    rows: result
      .filter((x) => x.cupID == cupID || !cupID)
      .map((x) => [
        ...(cupID ? [x.row] : []),
        ...[
          Math.round((x.sum / x.count) * 100) / 100,
          x.sum,
          (!cupID ? x.cup + " " : "") + "Day " + x.day,
        ],
      ]),
    numbered: false,
  };
}

async function dayMatchStat({
  stat,
  dir,
  cupID,
  date,
}: {
  stat: SQL<string | number>;
  dir: typeof desc;
  cupID?: number;
  date: Date;
}) {
  let customDate = sql`DATE(utcTime)`;
  let result = await db
    .select({
      cupID: Cup.cupID,
      row: Cup.cupName,
      count: count(),
      sum: stat,
      date: customDate,
      cup: Cup.cupName,
      day: sql`0`,
    })
    .from(MatchStat)
    .innerJoin(Match, eq(MatchStat.matchID, Match.matchID))
    .innerJoin(Cup, eq(Cup.cupID, Match.cupID))
    .where(
      and(
        eq(Match.valid, 1),
        eq(Match.official, 1),
        lte(Cup.end, date),
        eq(MatchStat.finalPeriod, true)
      )
    )
    .groupBy(customDate, Cup.cupID)
    .orderBy(dir(stat), desc(customDate))
    .limit(25);

  result = placeMaker(result, "sum");
  for (let row of result) {
    row.day =
      (
        await db
          .select({ date: customDate })
          .from(Match)
          .where(eq(Match.cupID, row.cupID))
          .groupBy(customDate)
          .orderBy(customDate)
      )
        .map((x) => x.date)
        .indexOf(row.date) + 1;
  }
  return {
    header: getHeaders(
      [{ header: "Per Match" }, { header: "Total" }, { header: "Day" }],
      cupID
    ),
    rows: result
      .filter((x) => x.cupID == cupID || !cupID)
      .map((x) => [
        ...(cupID ? [x.row] : []),
        ...[
          Math.round(((x.sum as number) / x.count) * 100) / 100,
          x.sum,
          (!cupID ? x.cup + " " : "") + "Day " + x.day,
        ],
      ]),
    numbered: false,
  };
}
function cupPlayerHeader(x, displayCup = false) {
  return [
    teamLink(x.team),
    x.name,
    `${displayCup ? x.cup + " " : ""}${x.round}`,
    `${teamLink(x.home)} - ${teamLink(x.away)}`,
  ];
}
function cupMatchHeader(x) {
  return `${x.cup} ${x.round}</td>
  <td>${teamLink(x.home)} - ${teamLink(x.away)}`;
}
function teamMatchHeader(x, displayCup = false) {
  return [
    teamLink(x.team),
    `${displayCup ? x.cup + " " : ""}${x.round}`,
    `${teamLink(x.home)} - ${teamLink(x.away)}`,
  ];
}
async function teamPerf({
  stat,
  date,
  dir,
  cupID,
}: {
  stat: MySqlColumn;
  dir: typeof desc;
  date: Date;
  cupID?: number;
}) {
  let result = (
    await db
      .select({
        home: Match.homeTeam,
        away: Match.awayTeam,
        cup: Cup.cupName,
        round: Match.round,
        avg: avg(stat),
        team: Player.team,
        date: Match.utcTime,
        cupID: Match.cupID,
        row: Match.round,
      })
      .from(Performance)
      .innerJoin(Match, eq(Match.matchID, Performance.matchID))
      .innerJoin(Cup, eq(Cup.cupID, Match.cupID))
      .innerJoin(Player, eq(Player.playerID, Performance.playerID))
      .where(and(eq(Match.valid, 1), eq(Match.official, 1), gt(stat, 0)))
      .groupBy(Match.matchID, Player.team)
      .orderBy(dir(avg(stat)), desc(Match.utcTime))
      .limit(25)
  ).map((x) => {
    x.avg = (Math.round(parseFloat(x.avg) * 100) / 100).toString();
    return x;
  });
  result = placeMaker(result, "avg");
  return {
    header: getHeaders(
      [{ header: "Record" }, { header: "Match", colspan: 3 }],
      cupID
    ),
    rows: result
      .filter((x) => x.cupID == cupID || !cupID)
      .map((x) => [
        ...(cupID ? [x.row] : []),
        ...[x.avg, ...teamMatchHeader(x, cupID ? false : true)],
      ]),
    numbered: false,
  };
}
async function teamStat({
  stat,
  date,
  where,
  cupID,
}: {
  stat: SQL<string | number>;
  date: Date;
  where?: SQLWrapper;
  cupID?: number;
}) {
  let result = await db
    .select({
      home: Match.homeTeam,
      away: Match.awayTeam,
      cup: Cup.cupName,
      round: Match.round,
      sum: stat,
      date: Match.utcTime,
      team: MatchStat.team,
      row: Match.round,
      cupID: Match.cupID,
    })
    .from(MatchStat)
    .innerJoin(Match, eq(Match.matchID, MatchStat.matchID))
    .innerJoin(Cup, eq(Cup.cupID, Match.cupID))
    .where(
      and(
        eq(Match.valid, 1),
        eq(Match.official, 1),
        where ? where : undefined,
        lte(Cup.end, date)
      )
    )
    .groupBy(Match.matchID, MatchStat.team)
    .orderBy(desc(stat), desc(Match.utcTime))
    .limit(25);
  result = placeMaker(result, "sum");
  return {
    header: getHeaders(
      [{ header: "Record" }, { header: "Match", colspan: 3 }],
      cupID
    ),
    rows: result
      .filter((x) => x.cupID == cupID || !cupID)
      .map((x) => [
        ...(cupID ? [x.row] : []),
        ...[x.sum, ...teamMatchHeader(x, cupID ? false : true)],
      ]),
    numbered: false,
  };
}
async function indPerf({
  stat,
  dir,
  date,
  cupID,
  wheres,
}: {
  stat: SQL<string | number>;
  dir: Function;
  date: Date;
  cupID?: number;
  wheres?: SQLWrapper;
}) {
  const selects = {
    name: PlayerLink.name,
    team: PlayerLink.team,
    linkID: PlayerLink.linkID,
    home: Match.homeTeam,
    away: Match.awayTeam,
    cup: Cup.cupName,
    cupID: Cup.cupID,
    round: Match.round,
    row: Match.round,
  };
  let result = await db
    .select({ ...selects, count: stat })
    .from(Performance)
    .innerJoin(Match, eq(Match.matchID, Performance.matchID))
    .innerJoin(Player, eq(Performance.playerID, Player.playerID))
    .innerJoin(PlayerLink, eq(Player.linkID, PlayerLink.linkID))
    .innerJoin(Cup, eq(Cup.cupID, Match.cupID))
    .where(
      and(
        eq(Match.valid, 1),
        eq(Match.official, 1),
        lte(Cup.end, date),
        not(eq(PlayerLink.name, "Unknown Player")),
        wheres !== undefined ? wheres : undefined
      )
    )
    .groupBy(Match.matchID, PlayerLink.linkID)
    .orderBy(dir(stat), desc(Match.utcTime))
    .limit(25);
  result = placeMaker(result, "count");
  return {
    header: getHeaders(
      [
        { header: "Record" },
        { header: "Player", colspan: 2 },
        { header: "Match", colspan: 2 },
      ],
      cupID
    ),
    rows: result
      .filter((x) => x.cupID == cupID || !cupID)
      .map((x) => [
        ...(cupID ? [x.row] : []),
        ...[x.count, ...cupPlayerHeader(x, cupID ? false : true)],
      ]),
    numbered: false,
  };
}
async function indEvent({
  eventTypes,
  date,
  wheres,
  cupID,
}: {
  eventTypes: number[];
  date: Date;
  wheres?: SQLWrapper;
  cupID?: number;
}) {
  const selects = {
    name: PlayerLink.name,
    team: PlayerLink.team,
    linkID: PlayerLink.linkID,
    home: Match.homeTeam,
    away: Match.awayTeam,
    cup: Cup.cupName,
    cupID: Cup.cupID,
    row: Cup.cupName,
    round: Match.round,
  };
  let result = await db
    .select({ ...selects, count: count() })
    .from(Event)
    .innerJoin(Match, eq(Match.matchID, Event.matchID))
    .innerJoin(Player, eq(Event.playerID, Player.playerID))
    .innerJoin(PlayerLink, eq(Player.linkID, PlayerLink.linkID))
    .innerJoin(Cup, eq(Cup.cupID, Match.cupID))
    .where(
      and(
        inArray(Event.eventType, eventTypes),
        eq(Match.valid, 1),
        eq(Match.official, 1),
        lte(Cup.end, date),
        not(eq(PlayerLink.name, "Unknown Player")),
        wheres !== undefined ? wheres : undefined
      )
    )
    .groupBy(Match.matchID, PlayerLink.linkID)
    .orderBy(desc(count()), desc(Match.utcTime))
    .limit(25);
  result = placeMaker(result, "count");
  return {
    header: getHeaders(
      [
        { header: "Record" },
        { header: "Player", colspan: 2 },
        { header: "Match", colspan: 2 },
      ],
      cupID
    ),
    rows: result
      .filter((x) => x.cupID == cupID || !cupID)
      .map((x) => [
        ...(cupID ? [x.row] : []),
        ...[x.count, ...cupPlayerHeader(x, cupID ? false : true)],
      ]),
    numbered: false,
  };
}
async function hatTrick({
  num,
  date,
  cupID,
}: {
  num: number;
  date: Date;
  cupID?: number;
}) {
  const records = await db
    .select({
      playerID: Event.playerID,
      matchID: Event.matchID,
      utcTime: Match.utcTime,
      round: Match.round,
      cupName: Cup.cupName,
      cupID: Cup.cupID,
      home: Match.homeTeam,
      away: Match.awayTeam,
    })
    .from(Event)
    .innerJoin(Match, eq(Event.matchID, Match.matchID))
    .innerJoin(Cup, eq(Match.cupID, Cup.cupID))
    .innerJoin(Player, eq(Event.playerID, Player.playerID))
    .where(
      and(
        inArray(Event.eventType, goalTypes),
        eq(Match.official, 1),
        eq(Match.valid, 1),
        isNotNull(Player.linkID),
        gt(Event.regTime, 0),
        lte(Cup.end, date),
        not(eq(Player.name, "Unknown Player"))
      )
    )
    .groupBy(Event.playerID, Event.matchID)
    .having(lte(count(), num))
    .orderBy(desc(Match.utcTime));
  let times: Array<{
    playerID: number;
    matchID: number;
    utcTime: Date;
    goals: Array<{ regTime: number; injTime: number }>;
    time: number;
    cupName: string;
    round: string;
    cupID: number;
    row: string;
    home: string;
    away: string;
  }> = [];
  for (const {
    playerID,
    matchID,
    utcTime,
    cupName,
    round,
    cupID,
    home,
    away,
  } of records) {
    const goals = await db
      .select()
      .from(Event)
      .where(
        and(
          eq(Event.playerID, playerID),
          eq(Event.matchID, matchID),
          inArray(Event.eventType, goalTypes)
        )
      )
      .orderBy(Event.regTime, Event.injTime);
    for (let i = 0; i <= goals.length - num; i++) {
      let goalsArray: Array<{ regTime: number; injTime: number }> = [];
      for (let j = i; j < i + num; j++) {
        const { regTime, injTime } = goals[j];
        goalsArray.push({ regTime, injTime });
      }
      const lastGoal = goalsArray[num - 1];
      const firstGoal = goalsArray[0];
      let lgi = lastGoal.injTime;
      let fgi = firstGoal.injTime;
      lgi = lgi >= 0 ? lgi : 0;
      fgi = fgi >= 0 ? fgi : 0;
      const time = lastGoal.regTime + lgi + fgi - (firstGoal.regTime + fgi);
      times.push({
        playerID,
        matchID,
        goals: goalsArray,
        time,
        utcTime,
        cupName,
        round,
        cupID,
        row: "",
        home,
        away,
      });
    }
  }
  times = times.sort((a, b) => {
    if (a.time > b.time) return 1;
    if (a.time < b.time) return -1;
    if (a.utcTime > b.utcTime) return -1;
    if (a.utcTime < b.utcTime) return 1;
    return 0;
  });
  let rowArray = [];
  let p = 0;
  let n = -1;
  for (let i = 0; i < Math.min(...[25, times.length]); i++) {
    const { playerID, goals, time, cupName, round, home, away } = times[i];
    const player = (await getPlayers({ playerID, getFriendlies: true }))[0];
    let x = times[i];
    if (x.time !== n) {
      n = x.time;
      p = i + 1;
    }
    x.row = p.toString();
    if (p == 1) x.row += "st";
    if (p == 2) x.row += "nd";
    if (p == 3) x.row += "rd";
    if (p > 3) x.row += "th";
    if (cupID && times[i].cupID !== cupID) continue;
    rowArray.push([
      ...(cupID ? [x.row] : []),
      ...[
        time,
        formatEventTime(goals[0]),
        formatEventTime(goals[num - 1]),
        teamLink(player.player.team),

        player.playerlink
          ? await playerLink([player.playerlink.linkID, player.playerlink.name])
          : player.player.name,
        `${cupID ? "" : cupName} ${round}`,
        `${teamLink(home)} - ${teamLink(away)}`,
      ],
    ]);
  }
  return {
    header: getHeaders(
      [
        { header: "Min" },
        { header: "From" },
        { header: "To" },
        { header: "Player", colspan: 2 },
        { header: "Match", colspan: 2 },
      ],
      cupID
    ),
    rows: rowArray,
    numbered: false,
  };
}
function placeMaker(result, key) {
  let i = 0;
  let n = -1;
  return result.map((x, p) => {
    if (x[key] !== n) {
      n = x[key] as number;
      i = p + 1;
    }
    x.row = i.toString();
    if (i == 1 || (i % 10 == 1 && i > 20)) {
      x.row += "st";
    } else if (i == 2 || (i % 10 == 2 && i > 20)) {
      x.row += "nd";
    } else if (i == 3 || (i % 10 == 3 && i > 20)) {
      x.row += "rd";
    } else if (i > 3) {
      x.row += "th";
    }
    return x;
  });
}
function getHeaders(
  array: Array<{ header: string; colspan?: number }>,
  cupID?: number
) {
  return [...(cupID ? [{ header: "#" }] : []), ...array];
}
