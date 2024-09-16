import { Request } from "express";
import { db } from "../../../db";
import { Cup, Match, Performance, Player } from "../../../db/schema";
import { eq, InferSelectModel } from "drizzle-orm";
import { cupLink, keySort, teamLink } from "../../../lib/helper";

export async function conditionDifferences(req: Request) {
  const matches = await db
    .select()
    .from(Match)
    .innerJoin(Cup, eq(Match.cupID, Cup.cupID))
    .where(eq(Match.valid, 1))
    .orderBy(Match.utcTime);
  const arr: Array<{
    match: InferSelectModel<typeof Match>;
    cup: InferSelectModel<typeof Cup>;
    higher: string;
    lower: string;
    higherCond: number;
    lowerCond: number;
    diff: number;
  }> = [];
  let w = 0;
  let d = 0;
  let l = 0;
  for (const { match, cup } of matches) {
    const conditions = await db
      .select()
      .from(Performance)
      .innerJoin(Player, eq(Performance.playerID, Player.playerID))
      .where(eq(Performance.matchID, match.matchID));
    let homeCond = [];
    let awayCond = [];
    for (const { player, performance } of conditions) {
      if (performance.cond <= 0 || performance.subOn !== 0) continue;
      if (player.team == match.homeTeam) {
        homeCond.push(performance.cond);
      } else {
        awayCond.push(performance.cond);
      }
    }
    if (homeCond.length < 11 || awayCond.length < 11) continue;
    const home = homeCond.reduce((a, b) => a + b) / homeCond.length;
    const away = awayCond.reduce((a, b) => a + b) / awayCond.length;
    const higher = home > away ? match.homeTeam : match.awayTeam;
    const lower = higher == match.homeTeam ? match.awayTeam : match.homeTeam;
    const higherCond = Math.max(home, away);
    const lowerCond = Math.min(home, away);
    const diff = Math.abs(home - away);
    if (diff >= 0.5) {
      if (higher == match.winningTeam) {
        w++;
      } else if (match.winningTeam == "draw") {
        d++;
      } else {
        l++;
      }
    }
    arr.push({ match, cup, higher, lower, diff, higherCond, lowerCond });
  }
  keySort(arr, "diff", true);
  let html = `<h2>Condition Difference</h2>The top 100 biggest condition differences (Starting players only).
<br>
When a team's average condition is 0.5 points higher than the other, it will win ${
    Math.round((w / (w + d + l)) * 10000) / 100
  }%, draw ${Math.round((d / (w + d + l)) * 10000) / 100}%, and lose ${
    Math.round((l / (w + d + l)) * 10000) / 100
  }% of the time.<br><br><table><tr>
    <th>#</th>
    <th colspan=2>Higher Cond Team</th>
    <th colspan=2>Lower Cond Team</th>
    <th>Match</th>
    <th>Diff</th>
    <th>Winner</th></tr>`;
  for (let i = 0; i < 100; i++) {
    const r = arr[i];
    html += `<tr>
        <td>${i + 1}</td>
        <td>${teamLink(r.higher, "left")}</td>
        <td>${Math.round(r.higherCond * 100) / 100}</td>
        <td>${Math.round(r.lowerCond * 100) / 100}</td>
        <td>${teamLink(r.lower, "left")}</td>
        <td>${await cupLink(r.cup, {
          logo: true,
          format: "long",
          text: " " + r.match.round,
          textPos: "after",
        })}</td>
        <td>${Math.round(r.diff * 100) / 100}</td>
        <td>${
          r.higher == r.match.winningTeam
            ? "Higher"
            : r.match.winningTeam == "draw"
            ? "Draw"
            : "Lower"
        }</td>
    </tr>`;
  }
  html += "</table><STYLE>td{text-align:left}</STYLE>";
  return { html, date: new Date() };
}
