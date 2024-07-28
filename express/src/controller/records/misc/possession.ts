import { Request } from "express";
import { getMatches } from "../../../db/commonFn";
import { db } from "../../../db";
import { Match, MatchStat } from "../../../db/schema";
import { and, eq, gte } from "drizzle-orm";

export async function possession(req: Request) {
  let html = `
  <style>
  .gridline{
    width: 20px;
    height: 100%;
    border-right: solid 1px gray;
    position: absolute;
    left: 0;
    z-index: 2;
    top: 0;
}
  </style>
  <h2>Possession is a Negative Stat</h2>`;
  let matches = await db
    .select()
    .from(MatchStat)
    .innerJoin(Match, eq(MatchStat.matchID, Match.matchID))
    .where(
      and(
        eq(Match.valid, 1),
        eq(MatchStat.finalPeriod, true),
        gte(MatchStat.poss, 5)
      )
    )
    .orderBy(MatchStat.poss);
  let poss: Record<string, { w: number; d: number; l: number }> = {};
  for (const { match, matchstat } of matches) {
    const i = matchstat.poss.toString();
    if (poss[i] == undefined) poss[i] = { w: 0, d: 0, l: 0 };
    if (matchstat.team == match.winningTeam) {
      poss[i].w++;
    } else if (match.winningTeam == "draw") {
      poss[i].d++;
    } else {
      poss[i].l++;
    }
  }
  html += `<br><br>
    <table>
        <tr>
            <th>Possession %</th>
            <th>Win</th>
            <th>Draw</th>
            <th>Loss</th>
            <th>Efficiency %</th>
            <th>Total Games</th>
        </tr>`;
  for (let p in poss) {
    html += `<tr>
        <td>${p}%</td>
        <td>${td(poss[p], "w")}</td>
        <td>${td(poss[p], "d")}</td>
        <td>${td(poss[p], "l")}</td>
        <td style="border:solid 1px var(--fg-color);;width:200px;position:relative;padding:0">
            <div style="width:${
              (poss[p].w / (poss[p].w + poss[p].d + poss[p].l)) * 200
            }px;min-height:20px;background:#2E51A2"></div>
            <div style="left:0" class="gridline"></div>
            <div style="left:20px" class="gridline"></div>
            <div style="left:40px" class="gridline"></div>
            <div style="left:60px" class="gridline"></div>
            <div style="left:80px" class="gridline"></div>
            <div style="left:100px" class="gridline"></div>
            <div style="left:120px" class="gridline"></div>
            <div style="left:140px" class="gridline"></div>
            <div style="left:160px" class="gridline"></div>
            <div style="left:180px" class="gridline"></div>
        </td>
        <td style='border: solid 1px var(--fg-color);;;padding:0'>
            <div style="width:${
              poss[p].w + poss[p].d + poss[p].l
            }px;min-height:20px;background:#2E51A2"></div>
        </td>
    </tr>`;
  }
  html += `</table>`;
  return { html, date: new Date() };
}
function td(a: { w: number; d: number; l: number }, s: "w" | "d" | "l") {
  return `${a[s]} (<b>${Math.round((a[s] / (a.w + a.d + a.l)) * 100)}%</b>)`;
}
