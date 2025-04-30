import { Request } from "express";
import { db } from "../../../db/index.js";
import { Cup, Match, Team } from "../../../db/schema.js";
import { and, desc, eq, gt, inArray, like, lte, max, or } from "drizzle-orm";
import { cupLink, teamLink } from "../../../lib/helper.js";

export async function facingCupWinner(req: Request) {
  let data = { html: "", date: new Date() };
  let html =
    "<h2>Playing the Cup Winner</h2><p>Teams that faced against the eventual cup winner, group stage + knockouts may not equal the total in cases where teams faced the cup winner twice in the same cup. Does not include SC 2011 and WC 2012.</p>";
  let finals = await db
    .select()
    .from(Match)
    .innerJoin(Cup, eq(Match.cupID, Cup.cupID))
    .where(and(eq(Match.round, "Final"), gt(Match.cupID, 2)))
    .orderBy(Match.utcTime);
  let teams: Record<
    string,
    {
      gs: number;
      ks: number;
      tot: number;
      cups: number;
      w: number;
      d: number;
      l: number;
      matches: Array<{ oTeam: string; match: string }>;
    }
  > = {};
  for (let { team } of await db.select().from(Team)) {
    teams[team] = {
      gs: 0,
      ks: 0,
      tot: 0,
      w: 0,
      d: 0,
      l: 0,
      cups: (
        await db
          .selectDistinct({ cupID: Match.cupID })
          .from(Match)
          .innerJoin(Cup, eq(Match.cupID, Cup.cupID))
          .where(
            and(
              or(eq(Match.homeTeam, team), eq(Match.awayTeam, team)),
              eq(Match.official, 1),
              lte(Cup.cupType, 2)
            )
          )
      ).length,
      matches: [],
    };
    teams[team].cups -= (
      await db
        .select()
        .from(Match)
        .where(
          and(
            eq(Match.round, "Final"),
            eq(Match.winningTeam, team),
            eq(Match.official, 1),
            gt(Match.cupID, 2)
          )
        )
    ).length;
  }
  for (let match of finals) {
    let winner = match.match.winningTeam;
    let otherTeams = await db
      .select()
      .from(Match)
      .where(
        and(
          eq(Match.cupID, match.cup.cupID),
          or(eq(Match.homeTeam, winner), eq(Match.awayTeam, winner)),
          eq(Match.official, 1)
        )
      );
    let playedTeams: Set<string> = new Set();
    for (let oMatch of otherTeams) {
      let otherTeam =
        oMatch.homeTeam == winner ? oMatch.awayTeam : oMatch.homeTeam;
      if (oMatch.round.includes("Group")) {
        teams[otherTeam].gs++;
      } else {
        teams[otherTeam].ks++;
      }
      if (oMatch.winningTeam == otherTeam) {
        teams[otherTeam].w++;
      } else if (oMatch.winningTeam == winner) {
        teams[otherTeam].l++;
      } else {
        teams[otherTeam].d++;
      }
      teams[otherTeam].matches.push({
        oTeam: winner,
        match: await cupLink(match.cup, {
          format: "med",
          text: oMatch.round,
        }),
      });
      if (!playedTeams.has(otherTeam)) {
        teams[otherTeam].tot++;
      }
      playedTeams.add(otherTeam);
    }
  }
  html += `<table>
    <tr><th>Team</th><th>Met Cup Winner<br>in Groups</th><th>Met Cup Winner<br>in KOs</th><th># Cups Meeting<br>The Winner</th><th>% of Cups Played<br>Meeting the Winner</th><th>W</th><th>D</th><th>L</th><th>Matches</th></tr>
    ${Object.entries(teams)
      .sort((a, b) => {
        return b[1].tot / b[1].cups - a[1].tot / a[1].cups;
      })
      .map(([team, data]) => {
        return `<tr><td>${teamLink(team, "right")}</td><td>${data.gs}</td><td>${
          data.ks
        }</td><td>${data.tot}</td><td>${
          Math.round((data.tot / data.cups) * 10000) / 100
        }%</td><td>${data.w}</td><td>${data.d}</td><td>${
          data.l
        }</td><td style='text-align:left'>
      ${data.matches
        .map((j) => {
          return `${teamLink(j.oTeam, "left")} ${j.match}`;
        })
        .join("<br>")}</td></tr>`;
      })
      .join("")}
    </table>
    <style>
      td{
        padding-bottom:1rem;
      }
    </style>`;
  data.html = html;
  data.date = new Date();
  return data;
}
