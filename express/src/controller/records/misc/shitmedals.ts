import { Request } from "express";
import { db } from "../../../db";
import { Cup, Match, Performance, Player } from "../../../db/schema";
import { and, desc, eq, gt, inArray, lt, not } from "drizzle-orm";
import { cupLink, playerLink, pos, teamLink } from "../../../lib/helper";

export async function shitMedals(req: Request) {
  let html = `<h2>Shit Medals</h2>
        <table><tr><th>Player</th><th>Pos</th><th>Rating</th><th>Match</th></tr>`;
  let players = await db
    .select()
    .from(Performance)
    .innerJoin(Player, eq(Performance.playerID, Player.playerID))
    .innerJoin(Match, eq(Match.matchID, Performance.matchID))
    .innerJoin(Cup, eq(Cup.cupID, Match.cupID))
    .where(
      and(
        not(eq(Player.medal, "")),
        inArray(Performance.rating, [4.5, 5]),
        eq(Match.valid, 1)
      )
    )
    .orderBy(desc(Match.utcTime));
  for (const { player, match, cup, performance } of players) {
    html += `<tr class='${
      match.winningTeam == player.team
        ? "W"
        : match.winningTeam == "draw"
        ? "D"
        : "L"
    }'>
                <td class='${player.medal}'>${await playerLink(
      [player.linkID, player.name, player.team],
      "left"
    )}</td>
                <td>${pos(player.regPos)}</td>
                <td>${performance.rating}</td>
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
                })}</td>
                </tr>`;
  }
  html += "</table><STYLE>td{text-align:left}td a{color:black}";
  return {
    html,
    date: new Date(),
  };
}
