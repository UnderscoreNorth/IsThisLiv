import { Request } from "express";
import { db } from "../../../db";
import { Cup, Event, Match, MatchStat, Player } from "../../../db/schema";
import { and, avg, count, desc, eq, gte, inArray } from "drizzle-orm";
import { cupLink, goalTypes, teamLink } from "../../../lib/helper";

export async function shotConversion(req: Request) {
  const matches = await db
    .select({ team: Player.team, c: count(), cup: Cup, match: Match })
    .from(Event)
    .innerJoin(Match, eq(Match.matchID, Event.matchID))
    .innerJoin(Player, eq(Player.playerID, Event.playerID))
    .innerJoin(
      MatchStat,
      and(eq(Match.matchID, MatchStat.matchID), eq(MatchStat.team, Player.team))
    )
    .innerJoin(Cup, eq(Cup.cupID, Match.cupID))
    .where(
      and(
        eq(MatchStat.finalPeriod, true),
        eq(Match.valid, 1),
        inArray(Event.eventType, goalTypes)
      )
    )
    .groupBy(Player.team, Match.matchID, Cup.cupID)
    .having(and(eq(count(), avg(MatchStat.shots)), gte(count(), 2)))
    .orderBy(desc(Match.utcTime));
  const record = Math.max(...matches.map((x) => x.c));
  let html = `<h2>100% Shot Conversion</h2>
  Minimum 2 shots/goals. The record is ${record} with those matches highlighted.<br><br><table><tr><th>Team</th><th>Shots/Goals</th><th>Match</th></tr>`;
  for (const { team, c, cup, match } of matches) {
    html += `<tr class='${c == record ? "Gold" : ""}'>
                <td>${teamLink(team, "left")}</td>
                <td>${c}</td>
                <td>${await cupLink(cup, {
                  logo: true,
                  format: "long",
                  textPos: "after",
                  text: ` ${match.round} against ${teamLink(
                    match.homeTeam == team ? match.awayTeam : match.homeTeam,
                    "left"
                  )}`,
                })}</td>
                </tr>`;
  }
  html += "</table><STYLE>td{text-align:left}</STYLE>";
  return { html, date: new Date() };
}
