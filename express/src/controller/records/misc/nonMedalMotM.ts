import { Request } from "express";
import { db } from "../../../db";
import { Cup, Match, Performance, Player } from "../../../db/schema";
import { and, desc, eq, gt } from "drizzle-orm";
import { cupLink, ksort, playerLink, pos, teamLink } from "../../../lib/helper";

export async function nonMedalMOTM(req: Request) {
  let html = "<h2>Nonmedal Man of the Match</h2>";
  let table =
    "<table><tr><th>Player</th><th>Pos</th><th>Rating</th><th>Match</th></tr>";
    let positions:Record<string,number> = {};
  let matches = await db
    .select()
    .from(Performance)
    .innerJoin(Player, eq(Performance.playerID, Player.playerID))
    .innerJoin(Match, eq(Match.matchID, Performance.matchID))
    .innerJoin(Cup, eq(Cup.cupID, Match.cupID))
    .where(and(eq(Performance.motm, true), eq(Player.medal,'')))
    .orderBy(desc(Match.utcTime));
  for (const { player, match, performance, cup } of matches) {
    positions[player.regPos] = positions[player.regPos] ?? 0;
    positions[player.regPos]++;
    table += `<tr>
      <td class='${player.medal}'>${await playerLink(
      [player.linkID, player.name, player.team],
      "left"
    )}</td>
                <td>${pos(player.regPos)}</td>
                <td>${
                  performance.rating >= 0 ? performance.rating : "Unknown"
                }</td>
                <td>${await cupLink(cup, {
                  logo: true,
                  format: "long",
                  textPos: "after",
                  text: ` ${match.round} against ${teamLink(
                    match.homeTeam == player.team
                      ? match.awayTeam
                      : match.homeTeam,
                    "left"
                  )}`,
                })}</td></tr>`;
  }
  table += "</table>";
  html += `<table>
    <tr><th>Pos</th><th>#</th></tr>
    ${Object.entries(ksort(positions)).map(([pos,num])=>`<tr><th>${pos}</th><td>${num}</td></tr>`).join('')}
  </table>
  ${table}`
  return { html, date: new Date() };
}
