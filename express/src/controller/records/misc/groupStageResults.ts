import { Request } from "express";
import { db } from "../../../db";
import { Cup, Match } from "../../../db/schema";
import { and, desc, eq, InferSelectModel, like, lte } from "drizzle-orm";
import { cupLink, keySort, teamLink } from "../../../lib/helper";

export async function groupStageResults(req: Request) {
  let html = `<style>img{max-height:80px}</style><h2>Group Stage Results</h2>`;
  let matches = await db
    .select()
    .from(Match)
    .innerJoin(Cup, eq(Match.cupID, Cup.cupID))
    .where(and(lte(Cup.cupType, 2), like(Match.round, "Group%")))
    .orderBy(desc(Match.utcTime));
  let groups: Record<
    string,
    {
      cup: InferSelectModel<typeof Cup>;
      group: string;
      teams: Record<string, number>;
      result: string;
    }
  > = {};
  let results: Record<string, { result: string; n: number }> = {};
  for (const { cup, match } of matches) {
    const key = cup.cupID + match.round;
    if (groups[key] == undefined)
      groups[key] = {
        cup,
        group: match.round,
        teams: {},
        result: "",
      };
    if (groups[key].teams[match.homeTeam] == undefined)
      groups[key].teams[match.homeTeam] = 0;
    if (groups[key].teams[match.awayTeam] == undefined)
      groups[key].teams[match.awayTeam] = 0;
    if (match.winningTeam == "draw") {
      groups[key].teams[match.homeTeam] += 1;
      groups[key].teams[match.awayTeam] += 1;
    } else if (match.winningTeam !== "") {
      groups[key].teams[match.winningTeam] += 3;
    }
  }
  for (const group of Object.values(groups)) {
    group.result = Object.values(group.teams)
      .sort((a, b) => a - b)
      .reverse()
      .join("-");
    if (results[group.result] == undefined)
      results[group.result] = { result: group.result, n: 0 };
    results[group.result].n++;
  }
  for (const result of keySort(Object.values(results), "n", true)) {
    html += `<div style='display:inline-block;'>
        <h3>${result.result} (${result.n})</h3>
        <div style='height:80vh;overflow-y:scroll'><table>`;
    for (const group of Object.values(groups)) {
      if (group.result == result.result) {
        html += `<tr><td rowspan=${
          Object.values(group.teams).length
        } ><b>${await cupLink(group.cup, {
          logo: true,
          format: "med",
          text: group.group,
          textPos: "above",
        })}</b></td>`;
        let first = true;
        let teams: Array<{ p: number; t: string }> = [];
        for (let team in group.teams) {
          teams.push({ t: team, p: group.teams[team] });
        }

        for (let team of keySort(teams, "p", true)) {
          if (first) {
            first = false;
          } else {
            html += `<tr>`;
          }
          html += `<td style='text-align:right'>${teamLink(
            team.t,
            "right"
          )}</td><td>${team.p}</td></tr>`;
        }
        html += `<tr><td colspan=3 style='height:1rem' ></td></tr>`;
      }
    }
    html += `</table></div></div>`;
  }
  return { html, date: new Date() };
}
