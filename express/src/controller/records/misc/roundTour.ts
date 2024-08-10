import { Request } from "express";
import { db } from "../../../db";
import { Cup, Match, Team } from "../../../db/schema";
import { and, eq, gt, lte, or } from "drizzle-orm";
import { cupShort, teamLink } from "../../../lib/helper";

export async function roundTour(req: Request) {
  let html = `<h2>Round Tour</h2>
    A table of the earliest cup that a board had played in for each group and knockout round.
    <br>Summer 11, Winter 12, and qualifier matches were not included in this.
    <br>Highlighted cells are the team's latest accomplishment.
    <br>Underlined cells are the team's latest group stage completion.
    <br>Sorted by earliest completion of the group stage tour.`;
  const rounds = [
    "Group A",
    "Group B",
    "Group C",
    "Group D",
    "Group E",
    "Group F",
    "Group G",
    "Group H",
    "Round of 16",
    "Quarter",
    "Semifinal",
    "Final",
  ];
  html +=
    "<table><tr><th></th><th colspan=8 >Group Stage</th><th colspan=4 >Knockout</th></tr>";
  html +=
    "<tr><td></td><td>A</td><td>B</td><td>C</td><td>D</td><td>E</td><td>F</td><td>G</td><td>H</td><td>RO16</td><td>QF</td><td>SF</td><td>F</td></tr>";
  let sql = await db.select().from(Team).orderBy(Team.team);
  let teams = [];
  for (const { team } of sql) {
    let temp = {
      team,
      latest: { date: new Date(0), round: "" },
      latestGroup: { date: new Date(0), round: "" },
      rounds: {},
    };
    let c = 0;
    for (let round of rounds) {
      let sql2 = await db
        .select()
        .from(Match)
        .innerJoin(Cup, eq(Match.cupID, Cup.cupID))
        .where(
          and(
            eq(Match.round, round),
            or(eq(Match.homeTeam, team), eq(Match.awayTeam, team)),
            lte(Cup.cupType, 2),
            gt(Cup.cupID, 2)
          )
        )
        .orderBy(Match.utcTime);
      let n = "";
      const result = sql2[0];
      if (result?.cup?.cupName) {
        n = cupShort(result.cup.cupName);
        temp.rounds[round] = n;
        let date = result.match.utcTime;
        if (date > temp.latest.date) {
          temp.latest.date = date;
          temp.latest.round = round;
        }
        if (date > temp.latestGroup.date && round.includes("Group")) {
          temp.latestGroup.date = date;
          temp.latestGroup.round = round;
        }
      }
    }
    teams.push(temp);
  }
  teams.sort((a, b) => {
    const numCompletedA = Object.keys(a.rounds).filter((x) =>
      x.includes("Group")
    ).length;
    const numCompletedB = Object.keys(b.rounds).filter((x) =>
      x.includes("Group")
    ).length;
    if (numCompletedA > numCompletedB) return -1;
    if (numCompletedA < numCompletedB) return 1;
    if (a.latestGroup.date > b.latestGroup.date) return 1;
    if (a.latestGroup.date < b.latestGroup.date) return -1;
    return 0;
  });
  for (let team of teams) {
    html += `<tr><td>${teamLink(team.team, "right")}</td>`;
    for (let round of rounds) {
      html += "<td ";
      if (round == team.latest.round) {
        html += " class='W'";
      }
      if (round == team.latestGroup.round) {
        html += " style='text-decoration:underline;'";
      }
      html += `>`;
      html += team.rounds[round] || "";
      html += "</td>";
    }
    html += "</tr>";
  }
  html += "</table>";
  return { html, date: new Date() };
}
