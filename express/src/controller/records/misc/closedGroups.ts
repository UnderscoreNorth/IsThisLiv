import { Request } from "express";
import { db } from "../../../db";
import { Cup, Match } from "../../../db/schema";
import { and, desc, eq, InferSelectModel, like, lte } from "drizzle-orm";
import { cupLink, krsort, teamLink } from "../../../lib/helper";

export async function closedGroups(req: Request) {
  const matches = await db
    .select()
    .from(Match)
    .innerJoin(Cup, eq(Match.cupID, Cup.cupID))
    .where(
      and(
        like(Match.round, "Group%"),
        lte(Cup.cupType, 2),
        eq(Match.official, 1)
      )
    )
    .orderBy(desc(Cup.start), Match.round, Match.utcTime);
  let n = 0;
  let round = "";
  let teams: Record<string, number> = {};
  let ccup: InferSelectModel<typeof Cup>;
  let groups: Array<{
    cup: InferSelectModel<typeof Cup>;
    group: string;
    teams: Array<string>;
  }> = [];
  for (const { match, cup } of matches) {
    if (ccup?.cupName !== cup.cupName || round !== match.round) {
      n = 0;
      round = match.round;
      ccup = cup;
      teams = {};
    }
    if (round) {
      for (const team of [match.homeTeam, match.awayTeam]) {
        if (teams[team] == undefined) teams[team] = 0;
        if (match.winningTeam == team) teams[team] += 3;
        if (match.winningTeam == "draw") teams[team]++;
      }

      n++;
      if (n == 4) {
        if (Object.keys(teams).length == 4) {
          if (Object.values(teams).sort().join(",") == "0,0,6,6") {
            groups.push({
              cup,
              group: match.round,
              teams: Object.entries(teams)
                .sort((a, b) => {
                  if (a[1] > b[1]) return -1;
                  if (a[1] < b[1]) return 1;
                  return 0;
                })
                .map((x) => x[0]),
            });
          }
        }
      }
    }
  }
  let html = `<h2>Closed Groups</h2>Groups that were closed by the second day.<br><br>
  <table>
    <tr>
        <th>Cup</th>
        <th>Group</th>
        <th colspan=4>teams</th>
    </tr>`;
  for (const group of groups) {
    html += `<tr>
            <td>${await cupLink(group.cup, { logo: true, format: "long" })}</td>
            <td>${group.group}</td>
            <td class='W'>${teamLink(group.teams[0], "left")}</td>
            <td class='W'>${teamLink(group.teams[1], "left")}</td>
            <td class='L'>${teamLink(group.teams[2], "left")}</td>
            <td class='L'>${teamLink(group.teams[3], "left")}</td>
        </tr>`;
  }
  html += `</table><STYLE>td{text-align:left}</STYLE>`;
  return { html, date: new Date() };
}
