import { Request } from "express";
import { db } from "../../../db";
import { Cup, Match, Performance, Player } from "../../../db/schema";
import { and, desc, eq, gt } from "drizzle-orm";
import { cupLink, playerLink, pos, teamLink } from "../../../lib/helper";

export async function subOnMOTM(req: Request) {
  let html = "<h2>Sub On Man of the Match</h2>";
  html +=
    "<table><tr><th>Player</th><th>Pos</th><th>Sub On</th><th>Rating</th><th>Match</th></tr>";
  let matches = await db
    .select()
    .from(Performance)
    .innerJoin(Player, eq(Performance.playerID, Player.playerID))
    .innerJoin(Match, eq(Match.matchID, Performance.matchID))
    .innerJoin(Cup, eq(Cup.cupID, Match.cupID))
    .where(and(eq(Performance.motm, true), gt(Performance.subOn, 0)))
    .orderBy(desc(Match.utcTime));
  for (const { player, match, performance, cup } of matches) {
    html += `<tr>
      <td class='${player.medal}'>${await playerLink(
      [player.linkID, player.name, player.team],
      "left"
    )}</td>
                <td>${pos(player.regPos)}</td>
                <td>${performance.subOn}</td>
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
  html += "</table>";
  return { html, date: new Date() };
}
