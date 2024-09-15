import { Request } from "express";
import { db } from "../../../db";
import { Match, Performance, Player, PlayerLink } from "../../../db/schema";
import { and, avg, count, desc, eq, gt, max, min, or } from "drizzle-orm";
import { playerLink } from "../../../lib/helper";

export async function alwaysSubbedOn(req: Request) {
  let html = `<h2>Always Subbed</h2>
        Players with 3+ matches played that were subbed in every time. Underlines indicate active players.<br><br>
        <table><tr><th>#</th><th>Player</th><th>Avg Cond</th></tr>`;

  const players = await db
    .select({
      p: PlayerLink,
      c: count(),
      cond: avg(Performance.cond),
      latestCup: max(Player.cupID),
    })
    .from(PlayerLink)
    .innerJoin(Player, eq(Player.linkID, PlayerLink.linkID))
    .innerJoin(Performance, eq(Performance.playerID, Player.playerID))
    .innerJoin(Match, eq(Match.matchID, Performance.matchID))
    .where(eq(Match.official, 1))
    .groupBy(PlayerLink.linkID)
    .having(and(gt(min(Performance.subOn), 0), gt(count(), 2)))
    .orderBy(desc(count()));
  const latestCups: Record<string, number> = {};
  for (const { p, cond, c, latestCup } of players) {
    if (latestCups[p.team] == undefined) {
      latestCups[p.team] = (
        await db
          .select()
          .from(Match)
          .where(
            and(
              or(eq(Match.homeTeam, p.team), eq(Match.awayTeam, p.team)),
              eq(Match.official, 1)
            )
          )
          .orderBy(desc(Match.utcTime))
      )[0].cupID;
    }
    html += `<tr style='${
      latestCup == latestCups[p.team] ? "text-decoration:underline" : ""
    }'>
                <td>${c}</td>
                <td>${await playerLink([p.linkID, p.name, p.team], "left")}</td>
                <td>${Math.round(parseFloat(cond) * 100) / 100}</td></tr>`;
  }
  html += "</table><STYLE>td{text-align:left}</STYLE>";
  return { html, date: new Date() };
}
