import { Request } from "express";
import { assistTypes, goalTypes, teamLink } from "../../lib/helper";
import {
  and,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  InferSelectModel,
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
  Performance,
  Player,
  PlayerLink,
} from "../../db/schema";
import { db } from "../../db";

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
      `;
    return { html };
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
