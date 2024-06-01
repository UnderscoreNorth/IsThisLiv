import { Request } from "express";
import { db } from "../../../db/index.js";
import { Match } from "../../../db/schema.js";
import { and, desc, eq, inArray, like, max, or } from "drizzle-orm";
import { cupLink, teamLink } from "../../../lib/helper.js";

export async function repeatGroups(req: Request) {
  let data = { html: "", date: new Date() };
  let html =
    "<h2>Repeat Groups</h2><p>Groups sharing at least 3 teams<br>Green teams promoted</p><table>";
  let sql = await db
    .select({
      round: Match.round,
      cupID: Match.cupID,
      homeTeam: Match.homeTeam,
    })
    .from(Match)
    .where(like(Match.round, "Group%"))
    .groupBy(Match.cupID, Match.round, Match.homeTeam)
    .orderBy(desc(Match.cupID), Match.round, Match.homeTeam);

  let oldGroup = "";
  let oldCup = 0;
  let cups: { cup: number; group: string; teams: string[] }[] = [];
  let teams = [];
  for (let i in sql) {
    let group = sql[i].round;
    let cup = sql[i].cupID;
    if ((group != oldGroup || cup != oldCup) && teams.length) {
      cups.push({ cup: oldCup, group: oldGroup, teams: teams });
      teams = [];
    }
    teams.push(sql[i].homeTeam);
    oldGroup = group;
    oldCup = cup;
  }
  cups.push({ cup: oldCup, group: oldGroup, teams: teams });
  for (let new_row of cups) {
    for (let old_row of cups) {
      if (new_row.cup > old_row.cup) {
        let sameTeams = [];
        for (let team of old_row.teams) {
          if (new_row.teams.includes(team)) sameTeams.push(team);
        }
        if (sameTeams.length >= 3) {
          let newTeam = [...sameTeams];
          let oldTeam = [...sameTeams];
          for (let team of new_row.teams) {
            if (!newTeam.includes(team)) newTeam.push(team);
          }
          for (let team of old_row.teams) {
            if (!oldTeam.includes(team)) oldTeam.push(team);
          }
          html += `<tr><td>${await cupLink(new_row.cup, {
            logo: true,
          })}</td><td>${new_row.group}</td>`;
          for (let team of newTeam) {
            let sql = await db
              .select()
              .from(Match)
              .where(
                and(
                  eq(Match.cupID, new_row.cup),
                  inArray(Match.round, ["Round of 16", "Round of 32"]),
                  or(eq(Match.homeTeam, team), eq(Match.awayTeam, team))
                )
              );

            if (sql.length) {
              html += `<td class='status-win'>${teamLink(team, "left")}</td>`;
            } else {
              html += `<td>${teamLink(team, "left")}</td>`;
            }
          }
          html += `</tr><tr><td>${await cupLink(old_row.cup, {
            logo: true,
          })}</td><td>${old_row.group}</td>`;
          for (let team of oldTeam) {
            let sql = await db
              .select()
              .from(Match)
              .where(
                and(
                  eq(Match.cupID, old_row.cup),
                  inArray(Match.round, ["Round of 16", "Round of 32"]),
                  or(eq(Match.homeTeam, team), eq(Match.awayTeam, team))
                )
              );
            if (sql.length) {
              html += `<td class='status-win'>${teamLink(team, "left")}</td>`;
            } else {
              html += `<td>${teamLink(team, "left")}</td>`;
            }
          }
          html +=
            "</tr><tr><td colspan=7><div style='min-height:1rem;background:black;margin-right:-0.5rem'></div></td></tr>";
        }
      }
    }
  }
  html += `</table>
        <STYLE>
            td{text-align:left}
        </STYLE>`;
  data.html = html;
  data.date = new Date();
  return data;
}
