import { Request } from "express";
import {
  assistTypes,
  cupLink,
  cupShort,
  dateFormat,
  formatEventTime,
  goalTypes,
  goalTypesOG,
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
  countDistinct,
  desc,
  eq,
  gt,
  gte,
  inArray,
  InferSelectModel,
  isNotNull,
  isNull,
  like,
  lte,
  max,
  min,
  not,
  or,
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
  Team,
} from "../../db/schema";
import { db } from "../../db";
import {
  getCup,
  getCups,
  getEvents,
  getMatches,
  getPlayers,
} from "../../db/commonFn";
import { MySqlColumn } from "drizzle-orm/mysql-core";

const recordTypes = [
  "match-team",
  "match-individual",
  "match-day",
  "match-match",
  "cup-individual",
  "cup-team",
  "cup-cup",
  "overall-streaks",
] as const;

export async function mainRecords(req: Request) {
  const url = req.baseUrl.toLowerCase();
  let date = new Date();
  const calcAll = true;
  date.setDate(date.getDate() + 1);
  for (const recordType of recordTypes) {
    if (url.includes(recordType)) {
      return await calcRecords({ types: [recordType], date, calcAll });
    }
  }
  return {};
}
export async function cupRecords(req: Request) {
  const cupID = parseInt(req.params.cupID);
  const cup = await getCup(cupID);
  if (!cup?.cupName) return {};
  const date = new Date(cup.end);
  date.setDate(date.getDate() + 1);
  return await calcRecords({
    types: [...recordTypes],
    date,
    cupID: cup.cupID,
    calcAll: false,
  });
}
export async function teamRecords(req: Request) {
  const team = req.params.team;
  let date = new Date();
  date.setDate(date.getDate() + 1);
  return await calcRecords({
    types: [...recordTypes],
    date,
    team,
    calcAll: true,
  });
}
export async function calcAllCups() {
  const cups = await getCups({ excludeFriendlies: true, asc: true });
  for (const cup of cups) {
    let date = new Date(cup.end);
    date.setDate(date.getDate() + 1);
    const data = await calcRecords({
      types: [...recordTypes],
      date,
      cupID: cup.cupID,
      calcAll: false,
    });
    await fs.writeFile(
      "cache/__api__records__cups__" + cup.cupID + ".json",
      JSON.stringify(data)
    );
    console.log(cup.cupName + " records rebuilt");
  }
  return {};
}
export async function calcAllTeams() {
  const teams = await db.select().from(Team);
  let date = new Date();
  date.setDate(date.getDate() + 1);
  for (const { team } of teams) {
    const data = await calcRecords({
      types: [...recordTypes],
      date,
      team,
      calcAll: true,
    });
    await fs.writeFile(
      "cache/__api__records__teams__" + team + ".json",
      JSON.stringify(data)
    );
    console.log(team + " records rebuilt");
  }
}

async function calcRecords({
  types,
  date,
  cupID,
  team,
  calcAll,
}: {
  types: Array<(typeof recordTypes)[number]>;
  date: Date;
  cupID?: number;
  team?: string;
  calcAll: boolean;
}) {
  const len = calcAll ? 25 : 10;
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
    });
    data[title]["Most Goals Scored In the First Half"] = await indEvent({
      eventTypes: goalTypes,
      wheres: lte(Event.regTime, 45),
    });
    data[title]["Most Goals Scored In the Second Half"] = await indEvent({
      eventTypes: goalTypes,
      wheres: and(lte(Event.regTime, 90), gt(Event.regTime, 45)),
    });
    data[title]["Most Goals Scored In Extra Time"] = await indEvent({
      eventTypes: goalTypes,
      wheres: gte(Event.regTime, 90),
    });
    data[title]["Most Assists"] = await indEvent({
      eventTypes: assistTypes,
    });
    data[title]["Most Saves"] = await indPerf({
      stat: sum(Performance.saves),
      dir: desc,
      wheres: gt(Performance.saves, 0),
    });
    data[title]["Highest Rating"] = await indPerf({
      stat: max(Performance.rating),
      dir: desc,
    });
    data[title]["Quickest Brace"] = await hatTrick({ num: 2 });
    data[title]["Quickest Hat Trick"] = await hatTrick({ num: 3 });
    data[title]["Quickest Double Brace"] = await hatTrick({
      num: 4,
    });
    data[title]["Quickest Glut"] = await hatTrick({ num: 5 });
  }
  if (types.includes("match-team")) {
    const title = "Match - Team";
    data[title] = {};
    data[title]["Most Shots"] = await teamStat({
      stat: max(MatchStat.shots),
    });
    data[title]["Most Shots on Target"] = await teamStat({
      stat: max(MatchStat.shotsOT),
    });
    data[title]["Most Shots all on Target"] = await teamStat({
      stat: max(MatchStat.shotsOT),
      where: eq(MatchStat.shots, MatchStat.shotsOT),
    });
    data[title]["Most Fouls"] = await teamStat({
      stat: max(MatchStat.fouls),
    });
    data[title]["Most Offsides"] = await teamStat({
      stat: max(MatchStat.offsides),
    });
    data[title]["Most Free Kicks"] = await teamStat({
      stat: max(MatchStat.freeKicks),
    });
    data[title]["Most Passes Made (Pes18+)"] = await teamStat({
      stat: max(MatchStat.passMade),
    });
    data[title]["Most Crosses"] = await teamStat({
      stat: max(MatchStat.crosses),
    });
    data[title]["Most Interceptions"] = await teamStat({
      stat: max(MatchStat.interceptions),
    });
    data[title]["Most Tackles"] = await teamStat({
      stat: max(MatchStat.tackles),
    });
    data[title]["Most Saves"] = await teamStat({
      stat: max(MatchStat.saves),
    });
    if (calcAll)
      data[title]["Highest Avg Rating"] = await teamPerf({
        stat: Performance.rating,
        dir: desc,
      });
    data[title]["Lowest Avg Rating"] = await teamPerf({
      stat: Performance.rating,
      dir: asc,
    });
    data[title]["Highest Avg Condition"] = await teamPerf({
      stat: Performance.cond,
      dir: desc,
    });
    data[title]["Lowest Avg Condition"] = await teamPerf({
      stat: Performance.cond,
      dir: asc,
    });
  }
  if (types.includes("match-day")) {
    const title = "Match - Day";
    data[title] = {};
    data[title]["Most Shots"] = await dayMatchStat({
      stat: sum(MatchStat.shots),
      dir: desc,
    });
    data[title]["Least Shots"] = await dayMatchStat({
      stat: sum(MatchStat.shots),
      dir: asc,
    });
    data[title]["Most Shots On Target"] = await dayMatchStat({
      stat: sum(MatchStat.shotsOT),
      dir: desc,
    });
    data[title]["Least Shots On Target"] = await dayMatchStat({
      stat: sum(MatchStat.shotsOT),
      dir: asc,
    });
    data[title]["Most Fouls"] = await dayMatchStat({
      stat: sum(MatchStat.fouls),
      dir: desc,
    });
    data[title]["Least Fouls"] = await dayMatchStat({
      stat: sum(MatchStat.fouls),
      dir: asc,
    });
    data[title]["Most Offsides"] = await dayMatchStat({
      stat: sum(MatchStat.offsides),
      dir: desc,
    });
    data[title]["Least Offsides"] = await dayMatchStat({
      stat: sum(MatchStat.offsides),
      dir: asc,
    });
    data[title]["Most Free Kicks"] = await dayMatchStat({
      stat: sum(MatchStat.freeKicks),
      dir: desc,
    });
    data[title]["Least Free Kicks"] = await dayMatchStat({
      stat: sum(MatchStat.freeKicks),
      dir: asc,
    });
    data[title]["Most Passes Made (Pes18+)"] = await dayMatchStat({
      stat: sum(MatchStat.passMade),
      dir: desc,
    });
    data[title]["Most Crosses"] = await dayMatchStat({
      stat: sum(MatchStat.crosses),
      dir: desc,
    });
    data[title]["Least Crosses"] = await dayMatchStat({
      stat: sum(MatchStat.crosses),
      dir: asc,
    });
    data[title]["Most Interceptions"] = await dayMatchStat({
      stat: sum(MatchStat.interceptions),
      dir: desc,
    });
    data[title]["Least Interceptions"] = await dayMatchStat({
      stat: sum(MatchStat.interceptions),
      dir: asc,
    });
    data[title]["Most Tackles"] = await dayMatchStat({
      stat: sum(MatchStat.tackles),
      dir: desc,
    });
    data[title]["Least Tackles"] = await dayMatchStat({
      stat: sum(MatchStat.tackles),
      dir: asc,
    });
    data[title]["Most Saves"] = await dayMatchStat({
      stat: sum(MatchStat.saves),
      dir: desc,
    });
    data[title]["Least Saves"] = await dayMatchStat({
      stat: sum(MatchStat.saves),
      dir: asc,
    });
    data[title]["Most Cards"] = await dayEvent({
      eventType: [...yellowCardTypes, ...redCardTypes],
      dir: desc,
    });
    data[title]["Most Goals"] = await dayEvent({
      eventType: goalTypes,
      dir: desc,
    });
    data[title]["Least Goals"] = await dayEvent({
      eventType: goalTypes,
      dir: asc,
    });
  }
  if (types.includes("match-match")) {
    const title = "Match";
    data[title] = {};
    const matchStatShort = async (
      statTitle: string,
      stat: MySqlColumn,
      both = false
    ) => {
      data[title][`Most ${statTitle}`] = await matchStat({
        dir: desc,
        stat: sum(stat),
      });
      if (both)
        data[title][`Least ${statTitle}`] = await matchStat({
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
    let result = await db
      .select({
        home: Match.homeTeam,
        away: Match.awayTeam,
        cup: Cup.cupName,
        round: Match.round,
        sum: count(),
        date: Match.utcTime,
        row: Match.round,
        cupID: Match.cupID,
      })
      .from(Match)
      .innerJoin(Event, eq(Match.matchID, Event.matchID))
      .innerJoin(Player, eq(Event.playerID, Player.playerID))
      .innerJoin(Cup, eq(Cup.cupID, Match.cupID))
      .where(
        and(
          eq(Match.valid, 1),
          eq(Match.official, 1),
          lte(Match.utcTime, date),
          gte(Cup.year, 2014),
          lte(Cup.cupType, 3),
          isNotNull(Player.linkID),
          inArray(Event.eventType, goalTypes),
          eq(Player.medal, "")
        )
      )
      .groupBy(Cup.cupID, Match.matchID)
      .orderBy(desc(count()), desc(Cup.end))
      .having(gte(count(), 1))
      .limit(len);
    result = placeMaker(result, "sum");
    data[title]["Most Non Medal Goals (2014+)"] = {
      header: getHeaders([
        { header: "Record" },
        { header: "Match", colspan: 2 },
      ]),
      rows: await Promise.all(
        result
          .filter(
            (x) =>
              (x.cupID == cupID || !cupID) &&
              (!team || [x.home, x.away].includes(team))
          )
          .map(async (x) => [
            ...(cupID || team ? [x.row] : []),
            ...[
              x.sum,
              `${
                !cupID
                  ? (await cupLink(x.cupID, { logo: true, format: "med" })) +
                    " "
                  : ""
              }${x.round}`,
              `${teamLink(x.home, "left")} - ${teamLink(x.away, "right")}`,
            ],
          ])
      ),
      numbered: false,
    };
  }
  if (types.includes("cup-individual")) {
    const title = "Cup - Individual";
    data[title] = {};
    data[title]["Most Goals Scored"] = await indCupEvent({
      eventTypes: goalTypes,
    });
    data[title]["Most Goals Scored (Group Stage)"] = await indCupEvent({
      eventTypes: goalTypes,
      wheres: like(Match.round, "%Group%"),
    });
    data[title]["Most Goals Scored (Knockout Stage)"] = await indCupEvent({
      eventTypes: goalTypes,
      wheres: not(like(Match.round, "%Group%")),
    });
    data[title]["Most Assists Scored"] = await indCupEvent({
      eventTypes: assistTypes,
    });
    data[title]["Most Assists Scored (Group Stage)"] = await indCupEvent({
      eventTypes: assistTypes,
      wheres: like(Match.round, "%Group%"),
    });
    data[title]["Most Assists Scored (Knockout Stage)"] = await indCupEvent({
      eventTypes: assistTypes,
      wheres: not(like(Match.round, "%Group%")),
    });
    data[title]["Most Saves"] = await indCupPerf({
      stat: sum(Performance.saves),
      dir: desc,
    });
    data[title]["Most Saves (Group Stage)"] = await indCupPerf({
      stat: sum(Performance.saves),
      dir: desc,
      wheres: like(Match.round, "%Group%"),
    });
    data[title]["Most Saves (Knockout Stage)"] = await indCupPerf({
      stat: sum(Performance.saves),
      dir: desc,
      wheres: not(like(Match.round, "%Group%")),
    });
  }
  if (types.includes("cup-team")) {
    const title = "Cup - Team";
    data[title] = {};
    const matchStatShort = async (
      statTitle: string,
      stat: MySqlColumn,
      both = false
    ) => {
      data[title][`Most ${statTitle}`] = await cupTeamMatchStat({
        dir: desc,
        stat: sum(stat),
      });
      if (both)
        data[title][`Least ${statTitle}`] = await cupTeamMatchStat({
          dir: asc,
          stat: sum(stat),
        });
    };
    await matchStatShort("Shots", MatchStat.shots, true);
    await matchStatShort("Shots on Target", MatchStat.shotsOT, true);
    await matchStatShort("Fouls", MatchStat.fouls, false);
    await matchStatShort("Offsides", MatchStat.offsides, false);
    await matchStatShort("Free Kicks", MatchStat.freeKicks, true);
    await matchStatShort("Passes Made (PES18+)", MatchStat.passMade, true);
    await matchStatShort("Interceptions", MatchStat.interceptions, false);
    await matchStatShort("Tackles", MatchStat.tackles, false);
    await matchStatShort("Crosses", MatchStat.crosses, false);
    await matchStatShort("Saves", MatchStat.saves, false);
    data[title]["Highest Avg Possession"] = await cupTeamMatchStat({
      dir: desc,
      stat: avg(MatchStat.poss),
    });
    data[title]["Lowest Avg Possession"] = await cupTeamMatchStat({
      dir: asc,
      stat: avg(MatchStat.poss),
    });
    let result = await db
      .select()
      .from(Match)
      .innerJoin(Cup, eq(Match.cupID, Cup.cupID))
      .innerJoin(Event, eq(Event.matchID, Match.matchID))
      .innerJoin(Player, eq(Event.playerID, Player.playerID))
      .where(
        and(
          eq(Match.valid, 1),
          eq(Match.official, 1),
          lte(Match.utcTime, date),
          lte(Cup.cupType, 3)
        )
      );
    let goals: Record<
      string,
      {
        goals: number;
        goalsAgainst: number;
        goalsGroup: number;
        goalsAgainstGroup: number;
        cupID: number;
        team: string;
        c?: number;
        row?: number;
      }
    > = {};
    for (let row of result) {
      const cupID = row.cup.cupID;
      const home = row.player.team;
      const away =
        row.player.team == row.match.homeTeam
          ? row.match.awayTeam
          : row.match.homeTeam;
      for (const team of [home, away]) {
        if (goals[cupID + team] == undefined)
          goals[cupID + team] = {
            goals: 0,
            goalsAgainst: 0,
            goalsGroup: 0,
            goalsAgainstGroup: 0,
            team: team,
            cupID: cupID,
          };
      }
      if (goalTypes.includes(row.event.eventType)) {
        goals[cupID + home].goals++;
        goals[cupID + away].goalsAgainst++;
        if (row.match.round.includes("Group")) {
          goals[cupID + home].goalsGroup++;
          goals[cupID + away].goalsAgainstGroup++;
        }
      } else if (goalTypesOG.includes(row.event.eventType)) {
        goals[cupID + home].goalsAgainst++;
        goals[cupID + away].goals++;
        if (row.match.round.includes("Group")) {
          goals[cupID + home].goalsAgainstGroup++;
          goals[cupID + away].goalsGroup++;
        }
      }
    }
    let goalStat = async (
      stat: (x: (typeof goals)[string]) => number,
      desc = true
    ) => {
      const dir = desc ? -1 : 1;
      let rows = Object.values(goals)
        .sort((a, b) => {
          if (stat(a) > stat(b)) return 1 * dir;
          if (stat(a) < stat(b)) return -1 * dir;
          if (a.cupID > b.cupID) return -1;
          if (a.cupID < b.cupID) return 1;
          return 0;
        })
        .filter((x, i) => i < len)
        .map((x) => {
          x.c = stat(x);
          return x;
        });
      rows = placeMaker(rows, "c");
      return {
        header: [
          ...getHeaders([{ header: "Total" }, { header: "Team" }]),
          ...(cupID ? [] : [{ header: "Cup" }]),
        ],
        rows: await Promise.all(
          rows
            .filter(
              (x) => (x.cupID == cupID || !cupID) && (!team || x.team == team)
            )
            .map(async (x) => [
              ...(cupID || team ? [x.row] : []),
              stat(x),
              teamLink(x.team, "left"),
              ...(cupID
                ? []
                : [await cupLink(x.cupID, { logo: true, format: "med" })]),
            ])
        ),
        numbered: false,
      };
    };
    data[title]["Most Goals Forward"] = await goalStat(
      (x: (typeof goals)[string]) => x.goals
    );
    data[title]["Least Goals Forward"] = await goalStat(
      (x: (typeof goals)[string]) => x.goals,
      false
    );
    data[title]["Most Goals Against"] = await goalStat(
      (x: (typeof goals)[string]) => x.goalsAgainst
    );
    data[title]["Least Goals Against"] = await goalStat(
      (x: (typeof goals)[string]) => x.goalsAgainst,
      false
    );
    data[title]["Highest Goal Difference"] = await goalStat(
      (x: (typeof goals)[string]) => x.goals - x.goalsAgainst
    );
    data[title]["Lowest Goal Difference"] = await goalStat(
      (x: (typeof goals)[string]) => x.goals - x.goalsAgainst,
      false
    );
    data[title]["Most Goals Forward (Group Stage)"] = await goalStat(
      (x: (typeof goals)[string]) => x.goalsGroup
    );
    data[title]["Least Goals Forward (Group Stage)"] = await goalStat(
      (x: (typeof goals)[string]) => x.goalsGroup,
      false
    );
    data[title]["Most Goals Against (Group Stage)"] = await goalStat(
      (x: (typeof goals)[string]) => x.goalsAgainstGroup
    );
    data[title]["Least Goals Against (Group Stage)"] = await goalStat(
      (x: (typeof goals)[string]) => x.goalsAgainstGroup,
      false
    );
    data[title]["Highest Goal Difference (Group Stage)"] = await goalStat(
      (x: (typeof goals)[string]) => x.goalsGroup - x.goalsAgainstGroup
    );
    data[title]["Lowest Goal Difference (Group Stage)"] = await goalStat(
      (x: (typeof goals)[string]) => x.goalsGroup - x.goalsAgainstGroup,
      false
    );
  }
  if (types.includes("cup-cup")) {
    const title = "Cup";
    data[title] = {};
    const matchStatShort = async (
      statTitle: string,
      stat: MySqlColumn,
      both = false
    ) => {
      data[title][`Most ${statTitle}`] = await cupMatchStat({
        dir: desc,
        stat,
      });
      if (both)
        data[title][`Least ${statTitle}`] = await cupMatchStat({
          dir: asc,
          stat,
        });
    };
    await matchStatShort("Shots", MatchStat.shots, true);
    await matchStatShort("Shots on Target", MatchStat.shotsOT, true);
    await matchStatShort("Fouls", MatchStat.fouls, true);
    await matchStatShort("Offsides", MatchStat.offsides, true);
    await matchStatShort("Free Kicks", MatchStat.freeKicks, true);
    await matchStatShort("Passes Made", MatchStat.passMade, true);
    await matchStatShort("Crosses", MatchStat.crosses, true);
    await matchStatShort("Interceptions", MatchStat.interceptions, true);
    await matchStatShort("Tackles", MatchStat.tackles, true);
    await matchStatShort("Saves", MatchStat.saves, true);
    data[title]["Highest Pass Completion"] = await cupMatchStat({
      dir: desc,
      stat: MatchStat.passComp,
    });
    data[title]["Highest Pass Completion"].header.splice(1, 1);
    data[title]["Highest Pass Completion"].header[0].header = "%";
    for (const row of data[title]["Highest Pass Completion"].rows) {
      row.splice(1, 1);
    }
    data[title]["Lowest Pass Completion"] = await cupMatchStat({
      dir: asc,
      stat: MatchStat.passComp,
    });
    data[title]["Lowest Pass Completion"].header.splice(1, 1);
    data[title]["Lowest Pass Completion"].header[0].header = "%";
    for (const row of data[title]["Lowest Pass Completion"].rows) {
      row.splice(1, 1);
    }
  }
  if (types.includes("overall-streaks")) {
    data["Streaks"] = {};
    let teams = await db.select().from(Team);
    const teamStreaks: Record<
      string,
      Array<{
        team: string;
        count: number;
        from: string;
        to: string;
        date: Date;
        cupID: number;
        row: string;
      }>
    > = {
      w: [],
      l: [],
      d: [],
      u: [],
      wl: [],
      dl: [],
      s: [],
      sl: [],
      c: [],
      cl: [],
    };
    const playerStreaks: Record<
      string,
      Array<{
        player: string;
        team: string;
        count: number;
        from: string;
        to: string;
        date: Date;
        cupID: number;
        row: string;
      }>
    > = {
      m: [],
      c: [],
    };
    for (const { team } of teams) {
      const s = {
        w: 0,
        l: 0,
        d: 0,
        u: 0,
        wl: 0,
        dl: 0,
        s: 0,
        c: 0,
        sl: 0,
        cl: 0,
        fw: "",
        fwl: "",
        fl: "",
        fd: "",
        fu: "",
        fdl: "",
        fs: "",
        fc: "",
        fsl: "",
        fcl: "",
      };
      const matches = await getMatches({ sort: "asc", team, end: date });
      for (const i in matches) {
        const { match } = matches[i];
        const set = (
          k: "w" | "l" | "d" | "u" | "wl" | "dl" | "s" | "c" | "sl" | "cl",
          num = 1
        ) => {
          if (s["f" + k] == "") s["f" + k] = dateFormat(match.utcTime, "med");
          s[k] += num;
        };
        const setStreak = (
          k: "w" | "l" | "d" | "u" | "wl" | "dl" | "s" | "c" | "sl" | "cl",
          cur = false
        ) => {
          if (s[k] >= 3) {
            teamStreaks[k].push({
              team,
              count: s[k],
              from: s["f" + k],
              to: cur ? "Ongoing" : dateFormat(match.utcTime, "med"),
              date: match.utcTime,
              row: "",
              cupID: match.cupID,
            });
          }
          s["f" + k] = "";
          s[k] = 0;
        };
        if (match.winningTeam == team) {
          set("w");
          set("u");
          set("dl");
          setStreak("l");
          setStreak("wl");
          setStreak("d");
        } else if (match.winningTeam == "draw") {
          set("d");
          set("u");
          set("wl");
          setStreak("w");
          setStreak("l");
          setStreak("dl");
        } else {
          set("l");
          set("wl");
          set("dl");
          setStreak("w");
          setStreak("u");
          setStreak("d");
        }
        const events = await getEvents({
          matchID: match.matchID,
          eventTypes: [...goalTypes, ...goalTypesOG],
        });
        let gf = 0;
        let ga = 0;
        for (const event of events) {
          if (goalTypes.includes(event.event.eventType)) {
            if (event.player.team == team) {
              gf++;
            } else {
              ga++;
            }
          } else if (goalTypesOG.includes(event.event.eventType)) {
            if (event.player.team == team) {
              ga++;
            } else {
              gf++;
            }
          }
        }
        if (gf > 0) {
          set("s");
          setStreak("sl");
        } else {
          set("sl");
          setStreak("s");
        }
        if (ga > 0) {
          set("c");
          setStreak("cl");
        } else {
          set("cl");
          setStreak("c");
        }
        if (parseInt(i) == matches.length - 1) {
          setStreak("wl", true);
          setStreak("l", true);
          setStreak("dl", true);
          setStreak("w", true);
          setStreak("u", true);
          setStreak("d", true);
          setStreak("s", true);
          setStreak("sl", true);
          setStreak("cl", true);
          setStreak("c", true);
        }
      }
    }
    for (const t in teamStreaks) {
      let results = teamStreaks[t]
        .sort((a, b) => {
          if (a.count > b.count) return -1;
          if (a.count < b.count) return 1;
          if (a.date > b.date) return -1;
          if (a.date < b.date) return 1;
          return 0;
        })
        .filter((x, i) => i < 25);
      results = placeMaker(results, "count");
      let title = "Longest";
      if (t == "w") title += " Winning Streak";
      if (t == "u") title += " Undefeated Streak";
      if (t == "l") title += " Losing Streak";
      if (t == "wl") title += " Winless Streak";
      if (t == "dl") title += " Drawless Streak";
      if (t == "d") title += " Draw Streak";
      if (t == "s") title += " Scoring Streak";
      if (t == "sl") title += " Without Scoring";
      if (t == "c") title += " Conceding Streak";
      if (t == "cl") title += " Without Conceding";
      data["Streaks"][title] = {
        header: [
          ...(cupID || team ? [{ header: "#" }] : []),
          ...[
            { header: "#" },
            { header: "Team" },
            { header: "From" },
            { header: "To" },
          ],
        ],
        rows: results
          .filter(
            (x) => (!team || x.team == team) && (!cupID || x.cupID == cupID)
          )
          .map((x) => {
            return [
              ...(cupID || team ? [x.row] : []),
              ...[x.count, teamLink(x.team, "left"), x.from, x.to],
            ];
          }),
        numbered: false,
      };
    }
    const players = await db
      .select({ PlayerLink })
      .from(PlayerLink)
      .innerJoin(Player, eq(PlayerLink.linkID, Player.linkID))
      .innerJoin(Event, eq(Event.playerID, Player.playerID))
      .innerJoin(Match, eq(Match.matchID, Event.matchID))
      .where(and(inArray(Event.eventType, goalTypes), lte(Match.utcTime, date)))
      .groupBy(PlayerLink.linkID)
      .having(gte(count(), 8));
    for (const j in players) {
      const { PlayerLink } = players[j];
      let m = 0;
      let c = 0;
      let fm = "";
      let fc = "";
      let cupID = 0;
      let cupName = "";
      let cupGoals = 0;
      const matches = await db
        .select()
        .from(Performance)
        .innerJoin(Match, eq(Performance.matchID, Match.matchID))
        .innerJoin(Player, eq(Player.playerID, Performance.playerID))
        .innerJoin(Cup, eq(Cup.cupID, Match.cupID))
        .where(
          and(
            eq(Match.official, 1),
            eq(Match.valid, 1),
            eq(Player.linkID, PlayerLink.linkID),
            lte(Match.utcTime, date),
            lte(Cup.cupType, 3)
          )
        )
        .orderBy(Cup.start, Match.utcTime);
      for (const i in matches) {
        const match = matches[i];
        const goals = (
          await db
            .select()
            .from(Event)
            .where(
              and(
                eq(Event.playerID, match.player.playerID),
                eq(Event.matchID, match.match.matchID),
                inArray(Event.eventType, goalTypes)
              )
            )
        ).length;
        if (cupID !== match.match.cupID) {
          if (cupGoals > 0) {
            c++;
          } else {
            if (c >= 3) {
              playerStreaks.c.push({
                count: c,
                player: await playerLink([
                  PlayerLink.linkID,
                  PlayerLink.name,
                  PlayerLink.team,
                ]),
                team: PlayerLink.team,
                from: fc,
                to: cupShort(cupName),
                date: match.match.utcTime,
                row: "",
                cupID: match.cup.cupID,
              });
            }
            c = 0;
            fc = "";
          }
          cupID = match.match.cupID;
          cupName = match.cup.cupName;
          cupGoals = 0;
        }
        cupGoals += goals;
        if (goals > 0) {
          if (fm == "") fm = dateFormat(match.match.utcTime, "med");
          m++;
          if (fc == "") fc = cupShort(match.cup.cupName);
        } else {
          if (m >= 3) {
            playerStreaks.m.push({
              count: m,
              player: await playerLink([
                PlayerLink.linkID,
                PlayerLink.name,
                PlayerLink.team,
              ]),
              team: PlayerLink.team,
              from: fm,
              to: dateFormat(match.match.utcTime, "med"),
              date: match.match.utcTime,
              row: "",
              cupID: match.cup.cupID,
            });
          }
          m = 0;
          fm = "";
        }
        if (parseInt(i) == matches.length - 1) {
          if (cupGoals > 0) c++;
          if (c >= 3) {
            playerStreaks.c.push({
              count: c,
              player: await playerLink([
                PlayerLink.linkID,
                PlayerLink.name,
                PlayerLink.team,
              ]),
              team: PlayerLink.team,
              from: fc,
              to: cupGoals > 0 ? "Ongoing" : cupShort(cupName),
              date: match.match.utcTime,
              row: "",
              cupID: match.cup.cupID,
            });
          }
          if (m >= 3) {
            playerStreaks.m.push({
              count: m,
              player: await playerLink([
                PlayerLink.linkID,
                PlayerLink.name,
                PlayerLink.team,
              ]),
              team: PlayerLink.team,
              from: fm,
              to: "Ongoing",
              date: match.match.utcTime,
              row: "",
              cupID: match.cup.cupID,
            });
          }
        }
      }
    }
    for (const t in playerStreaks) {
      let results = playerStreaks[t]
        .sort((a, b) => {
          if (a.count > b.count) return -1;
          if (a.count < b.count) return 1;
          if (a.date > b.date) return -1;
          if (a.date < b.date) return 1;
          return 0;
        })
        .filter((x, i) => i < 25);
      results = placeMaker(results, "count");
      let title = "Longest";
      if (t == "m") title += " Scoring Streak (Player/Match)";
      if (t == "c") title += " Scoring Streak (Player/Cup)";
      data["Streaks"][title] = {
        header: [
          ...(cupID || team ? [{ header: "#" }] : []),
          ...[
            { header: t == "m" ? "Matches" : "Cups" },
            { header: "Player", colspan: 2 },
            { header: "From" },
            { header: "To" },
          ],
        ],
        rows: results
          .filter(
            (x) => (!team || x.team == team) && (!cupID || x.cupID == cupID)
          )
          .map((x) => {
            return [
              ...(cupID || team ? [x.row] : []),
              ...[x.count, teamLink(x.team, "left"), x.player, x.from, x.to],
            ];
          }),
        numbered: false,
      };
    }
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
  async function cupMatchStat({
    stat,
    dir,
  }: {
    stat: MySqlColumn;
    dir: typeof desc;
  }) {
    let result = await db
      .select({
        sum: sum(stat),
        avg: avg(stat),
        row: Cup.cupName,
        cupID: Cup.cupID,
      })
      .from(MatchStat)
      .innerJoin(Match, eq(Match.matchID, MatchStat.matchID))
      .innerJoin(Cup, eq(Cup.cupID, Match.cupID))
      .where(
        and(
          eq(Match.valid, 1),
          eq(Match.official, 1),
          eq(MatchStat.finalPeriod, true),
          lte(Match.utcTime, date),
          gte(Cup.year, 2012),
          lte(Cup.cupType, 3)
        )
      )
      .groupBy(Cup.cupID)
      .orderBy(dir(avg(stat)), desc(Cup.end))
      .having(and(gte(sum(stat), 0), gte(count(), 5)))
      .limit(len);
    result = placeMaker(result, "sum");
    return {
      header: [
        ...getHeaders([{ header: "Per" }, { header: "Total" }], cupID),
        ...(cupID ? [] : [{ header: "Cup" }]),
      ],
      rows: await Promise.all(
        result
          .filter((x) => (x.cupID == cupID || !cupID) && !team)
          .map(async (x) => [
            ...(cupID || team ? [x.row] : []),
            ...[
              Math.floor(x.avg) +
                "." +
                Math.round((x.avg - Math.floor(x.avg)) * 100)
                  .toString()
                  .padEnd(2, "0"),
              x.sum,
              ...(cupID
                ? []
                : [await cupLink(x.cupID, { logo: true, format: "med" })]),
            ],
          ])
      ),
      numbered: false,
    };
  }
  async function cupTeamMatchStat({
    stat,
    dir,
  }: {
    stat: SQL<string | number>;
    dir: typeof desc;
  }) {
    let result = await db
      .select({
        team: MatchStat.team,
        sum: stat,
        row: Cup.cupName,
        cupID: Cup.cupID,
      })
      .from(MatchStat)
      .innerJoin(Match, eq(Match.matchID, MatchStat.matchID))
      .innerJoin(Cup, eq(Cup.cupID, Match.cupID))
      .where(
        and(
          eq(Match.valid, 1),
          eq(Match.official, 1),
          eq(MatchStat.finalPeriod, true),
          lte(Match.utcTime, date),
          gte(Cup.year, 2012),
          lte(Cup.cupType, 3)
        )
      )
      .groupBy(Cup.cupID, MatchStat.team)
      .orderBy(dir(stat), desc(Cup.end))
      .having(gte(stat, 0))
      .limit(len);
    result = placeMaker(result, "sum");
    return {
      header: [
        ...getHeaders([{ header: "Record" }, { header: "Team" }], cupID),
        ...(cupID ? [] : [{ header: "Cup" }]),
      ],
      rows: await Promise.all(
        result
          .filter(
            (x) => (x.cupID == cupID || !cupID) && (!team || x.team == team)
          )
          .map(async (x) => [
            ...(cupID || team ? [x.row] : []),
            ...[Math.floor(x.sum), teamLink(x.team, "left")],
            ...(cupID
              ? []
              : [await cupLink(x.cupID, { logo: true, format: "med" })]),
          ])
      ),
      numbered: false,
    };
  }
  async function matchStat({
    stat,
    dir,
  }: {
    stat: SQL<string | number>;
    dir: typeof desc;
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
          lte(Match.utcTime, date),
          gte(Cup.year, 2012)
        )
      )
      .groupBy(Match.matchID)
      .orderBy(dir(stat), desc(Match.utcTime))
      .limit(len);
    result = placeMaker(result, "sum");
    return {
      header: getHeaders([
        { header: "Record" },
        { header: "Match", colspan: 3 },
      ]),
      rows: await Promise.all(
        result
          .filter(
            (x) =>
              (x.cupID == cupID || !cupID) &&
              (!team || [x.home, x.away].includes(team))
          )
          .map(async (x) => [
            ...(cupID || team ? [x.row] : []),
            ...[
              x.sum,
              `${
                !cupID
                  ? (await cupLink(x.cupID, { logo: true, format: "med" })) +
                    " "
                  : ""
              }${x.round}`,
              `${teamLink(x.home, "left")} - ${teamLink(x.away, "right")}`,
            ],
          ])
      ),
      numbered: false,
    };
  }
  async function dayEvent({
    eventType,
    dir,
  }: {
    eventType: number[];
    dir: typeof desc;
  }) {
    let customDate = sql`DATE(utcTime)`;
    let customSum = sql<number>`SUM(CASE WHEN event.eventType IN (${eventType.join(
      ","
    )}) THEN 1 ELSE 0 END)`;
    let customCount = sql<number>`COUNT(DISTINCT(match.matchID))`;
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
      .where(
        and(eq(Match.valid, 1), eq(Match.official, 1), lte(Match.utcTime, date))
      )
      .innerJoin(Cup, eq(Match.cupID, Cup.cupID))
      .leftJoin(Event, eq(Event.matchID, Match.matchID))
      .groupBy(customDate)
      .orderBy(dir(customSum), desc(customDate))
      .limit(len);
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
      header: getHeaders([
        { header: "Per Match" },
        { header: "Total" },
        { header: "Day" },
      ]),
      rows: await Promise.all(
        result
          .filter((x) => (x.cupID == cupID || !cupID) && !team)
          .map(async (x) => [
            ...(cupID || team ? [x.row] : []),
            ...[
              Math.round((x.sum / x.count) * 100) / 100,
              x.sum,
              (!cupID
                ? (await cupLink(x.cupID, { logo: true, format: "med" })) + " "
                : "") +
                "Day " +
                x.day,
            ],
          ])
      ),
      numbered: false,
    };
  }
  async function dayMatchStat({
    stat,
    dir,
  }: {
    stat: SQL<string | number>;
    dir: typeof desc;
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
          lte(Match.utcTime, date),
          eq(MatchStat.finalPeriod, true),
          gte(Cup.year, 2012)
        )
      )
      .groupBy(customDate, Cup.cupID)
      .orderBy(dir(stat), desc(customDate))
      .limit(len);

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
      header: getHeaders([
        { header: "Per Match" },
        { header: "Total" },
        { header: "Day" },
      ]),
      rows: await Promise.all(
        result
          .filter((x) => (x.cupID == cupID || !cupID) && !team)
          .map(async (x) => [
            ...(cupID || team ? [x.row] : []),
            ...[
              Math.round(((x.sum as number) / x.count) * 100) / 100,
              x.sum,
              (!cupID
                ? (await cupLink(x.cupID, { logo: true, format: "med" })) + " "
                : "") +
                "Day " +
                x.day,
            ],
          ])
      ),
      numbered: false,
    };
  }
  async function teamPerf({
    stat,
    dir,
  }: {
    stat: MySqlColumn;
    dir: typeof desc;
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
        .where(
          and(
            eq(Match.valid, 1),
            eq(Match.official, 1),
            gt(stat, 0),
            lte(Match.utcTime, date)
          )
        )
        .groupBy(Match.matchID, Player.team)
        .orderBy(dir(avg(stat)), desc(Match.utcTime))
        .limit(len)
    ).map((x) => {
      x.avg = (Math.round(parseFloat(x.avg) * 100) / 100).toString();
      return x;
    });
    result = placeMaker(result, "avg");
    return {
      header: getHeaders([
        { header: "Record" },
        { header: "Match", colspan: 3 },
      ]),
      rows: await Promise.all(
        result
          .filter(
            (x) => (x.cupID == cupID || !cupID) && (!team || x.team == team)
          )
          .map(async (x) => [
            ...(cupID || team ? [x.row] : []),
            ...[x.avg, ...(await teamMatchHeader(x, cupID ? false : true))],
          ])
      ),
      numbered: false,
    };
  }
  async function teamStat({
    stat,
    where,
  }: {
    stat: SQL<string | number>;
    where?: SQLWrapper;
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
          lte(Match.utcTime, date)
        )
      )
      .groupBy(Match.matchID, MatchStat.team)
      .orderBy(desc(stat), desc(Match.utcTime))
      .limit(len);
    result = placeMaker(result, "sum");
    return {
      header: getHeaders([
        { header: "Record" },
        { header: "Match", colspan: 3 },
      ]),
      rows: await Promise.all(
        result
          .filter(
            (x) => (x.cupID == cupID || !cupID) && (!team || x.team == team)
          )
          .map(async (x) => [
            ...(cupID || team ? [x.row] : []),
            ...[x.sum, ...(await teamMatchHeader(x, cupID ? false : true))],
          ])
      ),
      numbered: false,
    };
  }
  async function indPerf({
    stat,
    dir,
    wheres,
  }: {
    stat: SQL<string | number>;
    dir: Function;
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
          lte(Match.utcTime, date),
          not(eq(PlayerLink.name, "Unknown Player")),
          wheres !== undefined ? wheres : undefined
        )
      )
      .groupBy(Match.matchID, PlayerLink.linkID)
      .orderBy(dir(stat), desc(Match.utcTime))
      .limit(len);
    result = placeMaker(result, "count");
    return {
      header: getHeaders([
        { header: "Record" },
        { header: "Player", colspan: 2 },
        { header: "Match", colspan: 2 },
      ]),
      rows: await Promise.all(
        result
          .filter(
            (x) => (x.cupID == cupID || !cupID) && (!team || x.team == team)
          )
          .map(async (x) => [
            ...(cupID || team ? [x.row] : []),
            ...[x.count, ...(await cupPlayerHeader(x, cupID ? false : true))],
          ])
      ),
      numbered: false,
    };
  }
  async function indCupEvent({
    eventTypes,
    wheres,
  }: {
    eventTypes: number[];
    wheres?: SQLWrapper;
  }) {
    const selects = {
      name: PlayerLink.name,
      team: PlayerLink.team,
      linkID: PlayerLink.linkID,
      cup: Cup.cupName,
      cupID: Cup.cupID,
      row: Cup.cupName,
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
          lte(Match.utcTime, date),
          not(eq(PlayerLink.name, "Unknown Player")),
          wheres !== undefined ? wheres : undefined
        )
      )
      .groupBy(Cup.cupID, PlayerLink.linkID)
      .orderBy(desc(count()), desc(Cup.end))
      .limit(len);
    result = placeMaker(result, "count");
    return {
      header: [
        ...getHeaders([{ header: "Record" }, { header: "Player", colspan: 2 }]),
        ...(cupID ? [] : [{ header: "Cup", colspan: 1 }]),
      ],
      rows: await Promise.all(
        result
          .filter(
            (x) => (x.cupID == cupID || !cupID) && (!team || x.team == team)
          )
          .map(async (x) => [
            ...(cupID || team ? [x.row] : []),
            ...[x.count, teamLink(x.team, "left"), x.name],
            ...(cupID
              ? []
              : [await cupLink(x.cupID, { logo: true, format: "med" })]),
          ])
      ),
      numbered: false,
    };
  }
  async function indCupPerf({
    stat,
    dir,
    wheres,
  }: {
    stat: SQL<string | number>;
    dir: Function;
    wheres?: SQLWrapper;
  }) {
    const selects = {
      name: PlayerLink.name,
      team: PlayerLink.team,
      linkID: PlayerLink.linkID,
      cup: Cup.cupName,
      cupID: Cup.cupID,
      row: Cup.cupName,
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
          lte(Match.utcTime, date),
          not(eq(PlayerLink.name, "Unknown Player")),
          wheres !== undefined ? wheres : undefined
        )
      )
      .groupBy(Cup.cupID, PlayerLink.linkID)
      .orderBy(dir(stat), desc(Cup.end))
      .limit(len);
    result = placeMaker(result, "count");
    return {
      header: [
        ...getHeaders([{ header: "Record" }, { header: "Player", colspan: 2 }]),
        ...(cupID ? [] : [{ header: "Cup", colspan: 1 }]),
      ],
      rows: await Promise.all(
        result
          .filter(
            (x) => (x.cupID == cupID || !cupID) && (!team || x.team == team)
          )
          .map(async (x) => [
            ...(cupID || team ? [x.row] : []),
            ...[x.count, teamLink(x.team, "left"), x.name],
            ...(cupID
              ? []
              : [await cupLink(x.cupID, { logo: true, format: "med" })]),
          ])
      ),
      numbered: false,
    };
  }
  async function indEvent({
    eventTypes,
    wheres,
  }: {
    eventTypes: number[];
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
          lte(Match.utcTime, date),
          not(eq(PlayerLink.name, "Unknown Player")),
          wheres !== undefined ? wheres : undefined
        )
      )
      .groupBy(Match.matchID, PlayerLink.linkID)
      .orderBy(desc(count()), desc(Match.utcTime))
      .limit(len);
    result = placeMaker(result, "count");
    return {
      header: getHeaders([
        { header: "Record" },
        { header: "Player", colspan: 2 },
        { header: "Match", colspan: 2 },
      ]),
      rows: await Promise.all(
        result
          .filter(
            (x) => (x.cupID == cupID || !cupID) && (!team || x.team == team)
          )
          .map(async (x) => [
            ...(cupID || team ? [x.row] : []),
            ...[x.count, ...(await cupPlayerHeader(x, cupID ? false : true))],
          ])
      ),
      numbered: false,
    };
  }
  async function hatTrick({ num }: { num: number }) {
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
          lte(Match.utcTime, date),
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
    for (let i = 0; i < Math.min(...[len, times.length]); i++) {
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
      if (
        (cupID && times[i].cupID !== cupID) ||
        (team && player.player.team !== team)
      )
        continue;
      rowArray.push([
        ...(cupID || team ? [x.row] : []),
        ...[
          time,
          formatEventTime(goals[0]),
          formatEventTime(goals[num - 1]),
          teamLink(player.player.team, "left"),

          player.playerlink
            ? await playerLink([
                player.playerlink.linkID,
                player.playerlink.name,
                player.playerlink.team,
              ])
            : player.player.name,
          `${
            cupID ? "" : await cupLink(x.cupID, { logo: true, format: "med" })
          } ${round}`,
          `${teamLink(home, "left")} - ${teamLink(away, "right")}`,
        ],
      ]);
    }
    return {
      header: getHeaders([
        { header: "Min" },
        { header: "From" },
        { header: "To" },
        { header: "Player", colspan: 2 },
        { header: "Match", colspan: 2 },
      ]),
      rows: rowArray,
      numbered: false,
    };
  }

  function getHeaders(array: Array<{ header: string; colspan?: number }>) {
    return [...(cupID || team ? [{ header: "#" }] : []), ...array];
  }
}

async function cupPlayerHeader(x, displayCup = false) {
  return [
    teamLink(x.team, "left"),
    x.name,
    `${
      displayCup
        ? (await cupLink(x.cupID, { logo: true, format: "med" })) + " "
        : ""
    }${x.round}`,
    `${teamLink(x.home, "left")} - ${teamLink(x.away, "right")}`,
  ];
}
async function teamMatchHeader(x, displayCup = false) {
  return [
    teamLink(x.team, "left"),
    `${
      displayCup
        ? (await cupLink(x.cupID, { logo: true, format: "med" })) + " "
        : ""
    }${x.round}`,
    `${teamLink(x.home, "left")} - ${teamLink(x.away, "right")}`,
  ];
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
