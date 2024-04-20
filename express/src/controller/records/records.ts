import { Request } from "express";
import {
  assistTypes,
  formatEventTime,
  goalTypes,
  playerLink,
  teamLink,
} from "../../lib/helper";
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
import { getPlayers } from "../../db/commonFn";
import { MySqlColumn } from "drizzle-orm/mysql-core";

export async function mainRecords(req: Request) {
  let html = "";
  const url = req.baseUrl.toLowerCase();
  if (url.includes("match-individual")) {
    html = `<h2>Match Records</h2>
    <h3>Individual</h3>
    ${await indEvent("Most Goals Scored", goalTypes)}
    ${await indEvent(
      "Most Goals Scored In the First Half",
      goalTypes,
      lte(Event.regTime, 45)
    )}
    ${await indEvent(
      "Most Goals Scored In the Second Half",
      goalTypes,
      and(lte(Event.regTime, 90), gt(Event.regTime, 45))
    )}
    ${await indEvent(
      "Most Goals Scored In Extra Time",
      goalTypes,
      gte(Event.regTime, 90)
    )}
      ${await indEvent("Most Assists", assistTypes)}
      ${await indPerf(
        "Most Saves",
        sum(Performance.saves),
        desc,
        gt(Performance.saves, 0)
      )}
      ${await indPerf("Highest Rating", max(Performance.rating), desc)}
      ${await hatTrick("Quickest Brace", 2)}
      ${await hatTrick("Quickest Hat Trick", 3)}
      ${await hatTrick("Quickest Double Brace", 4)}
      ${await hatTrick("Quickest Glut", 5)}
      ${await hatTrick("Quickest Double Hat Trick", 6)}
      `;
    return { html };
  } else if (url.includes("match-team")) {
    html = `<h2>Match Records</h2>
    <h3>Team</h3>
    ${await teamStat("Most Shots", max(MatchStat.shots))}
    ${await teamStat("Most Shots on Target", max(MatchStat.shotsOT))}
    ${await teamStat(
      "Most Shots all on Target",
      max(MatchStat.shotsOT),
      eq(MatchStat.shots, MatchStat.shotsOT)
    )}
    ${await teamStat("Most Fouls", max(MatchStat.fouls))}
    ${await teamStat("Most Offsides", max(MatchStat.offsides))}
    ${await teamStat("Most Free Kicks", max(MatchStat.freeKicks))}
    ${await teamStat("Most Passes Made (Pes18+)", max(MatchStat.passMade))}
    ${await teamStat("Most Crosses", max(MatchStat.crosses))}
    ${await teamStat("Most Interceptions", max(MatchStat.interceptions))}
    ${await teamStat("Most Tackles", max(MatchStat.tackles))}
    ${await teamStat("Most Saves", max(MatchStat.saves))}
    ${await teamPerf("Highest Avg Rating", Performance.rating, desc)}
    ${await teamPerf("Lowest Avg Rating", Performance.rating, asc)}
    ${await teamPerf("Highest Avg Condition", Performance.cond, desc)}
    ${await teamPerf("Lowest Avg Condition", Performance.cond, asc)}
    
    `;
  }

  return { html };
}
function cupPlayerHeader(x: InferSelectModel<typeof PlayerLink>) {
  return `${teamLink(x.team)}</td><td>${x.name}`;
}
function cupMatchHeader(x) {
  return `${x.cup} ${x.round}</td>
  <td>${teamLink(x.home)} - ${teamLink(x.away)}`;
}
function teamMatchHeader(x) {
  return `${teamLink(x.team)}</td><td>${x.cup} ${x.round}</td>
  <td>${teamLink(x.home)} - ${teamLink(x.away)}`;
}
async function teamPerf(title: string, stat: MySqlColumn, dir: typeof desc) {
  const result = (
    await db
      .select({
        home: Match.homeTeam,
        away: Match.awayTeam,
        cup: Cup.cupName,
        round: Match.round,
        avg: avg(stat),
        team: Player.team,
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
  return createTable(
    [
      { header: "Record", sql: "avg" },
      { header: "Match", colspan: 3, custom: teamMatchHeader },
    ],
    result,
    false,
    title
  );
}
async function teamStat(
  title: string,
  stat: SQL<string | number>,
  where?: SQLWrapper
) {
  const result = await db
    .select({
      home: Match.homeTeam,
      away: Match.awayTeam,
      cup: Cup.cupName,
      round: Match.round,
      sum: stat,
      team: MatchStat.team,
    })
    .from(MatchStat)
    .innerJoin(Match, eq(Match.matchID, MatchStat.matchID))
    .innerJoin(Cup, eq(Cup.cupID, Match.cupID))
    .where(
      and(eq(Match.valid, 1), eq(Match.official, 1), where ? where : undefined)
    )
    .groupBy(Match.matchID, MatchStat.team)
    .orderBy(desc(stat), desc(Match.utcTime))
    .limit(25);
  return createTable(
    [
      { header: "Record", sql: "sum" },
      { header: "Match", colspan: 3, custom: teamMatchHeader },
    ],
    result,
    false,
    title
  );
}
async function indPerf(
  title: string,
  stat: SQL<string | number>,
  dir: Function,
  wheres?: SQLWrapper
) {
  const selects = {
    name: PlayerLink.name,
    team: PlayerLink.team,
    linkID: PlayerLink.linkID,
    home: Match.homeTeam,
    away: Match.awayTeam,
    cup: Cup.cupName,
    round: Match.round,
  };
  const result = await db
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
        not(eq(PlayerLink.name, "Unknown Player")),
        wheres !== undefined ? wheres : undefined
      )
    )
    .groupBy(Match.matchID, PlayerLink.linkID)
    .orderBy(dir(stat), desc(Match.utcTime))
    .limit(25);
  return createTable(
    [
      { header: "Record", sql: "count" },
      { header: "Player", colspan: 2, custom: cupPlayerHeader },
      { header: "Match", colspan: 2, custom: cupMatchHeader },
    ],
    result,
    false,
    title
  );
}
async function indEvent(
  title: string,
  eventTypes: number[],
  wheres?: SQLWrapper
) {
  const selects = {
    name: PlayerLink.name,
    team: PlayerLink.team,
    linkID: PlayerLink.linkID,
    home: Match.homeTeam,
    away: Match.awayTeam,
    cup: Cup.cupName,
    round: Match.round,
  };
  const result = await db
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
        not(eq(PlayerLink.name, "Unknown Player")),
        wheres !== undefined ? wheres : undefined
      )
    )
    .groupBy(Match.matchID, PlayerLink.linkID)
    .orderBy(desc(count()), desc(Match.utcTime))
    .limit(25);
  return createTable(
    [
      { header: "Record", sql: "count" },
      { header: "Player", colspan: 2, custom: cupPlayerHeader },
      { header: "Match", colspan: 2, custom: cupMatchHeader },
    ],
    result,
    false,
    title
  );
}
async function hatTrick(title: string, num: number) {
  const records = await db
    .select({
      playerID: Event.playerID,
      matchID: Event.matchID,
      utcTime: Match.utcTime,
      round: Match.round,
      cupName: Cup.cupName,
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
  }> = [];
  for (const { playerID, matchID, utcTime, cupName, round } of records) {
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
        const injTimeAdd = injTime >= 0 ? injTime : 0;
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
  for (let i = 0; i < Math.min(...[25, times.length]); i++) {
    const { playerID, goals, time, cupName, round } = times[i];
    const player = (await getPlayers({ playerID, getFriendlies: true }))[0];
    rowArray.push(`<tr>
      <td>${time}</td>
      <td>${formatEventTime(goals[0])}</td>
      <td>${formatEventTime(goals[num - 1])}</td>
      <td>${teamLink(player.player.team)}</td>
      <td>${
        player.playerlink
          ? await playerLink([player.playerlink.linkID, player.playerlink.name])
          : player.player.name
      }</td>
      <td>${cupName} ${round}</td>
    </tr>`);
  }
  return `
  <table>
  <tr><th colspan=7 >${title}</th></tr>
	<tr><th>Min</th><th>From</th><th>To</th><th colspan=2 >Player</th><th colspan=2 >Match</th></tr>
  ${rowArray.join(" ")}
  </table>
  `;
}

function createTable(
  cols: { colspan?: number; header: string; custom?: Function; sql?: string }[],
  rows: Array<Record<string, string | number>>,
  numbered = true,
  title = ""
) {
  let colspan = 0;
  for (let col of cols) {
    colspan += col.colspan ?? 1;
  }
  let html = `
          <table>
              ${
                title !== ""
                  ? `<tr>
                  <th colspan=${colspan}>${title}</th>
              </tr>`
                  : ""
              }
              <tr>
                  ${cols
                    .map((x) => {
                      return `<th colspan=${x.colspan ?? 1}>${x.header}</th>`;
                    })
                    .join(" ")}
              </tr>
              ${rows
                .map((x, i) => {
                  let text = "<tr>";
                  if (numbered) text += `<td>${i + 1}</td>`;
                  for (let col of cols) {
                    if (col.custom !== undefined) {
                      text += `<td>${col.custom(x)}</td>`;
                    } else {
                      text += `<td>${x[col.sql]}</td>`;
                    }
                  }
                  text += "</tr>";
                  return text;
                })
                .join(" ")}
          </table>`;
  return html;
}
