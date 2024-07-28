import { Request } from "express";
import { db } from "../../../db";
import { Cup, Match, Team } from "../../../db/schema";
import { and, eq, or } from "drizzle-orm";
import {
  cupLink,
  cupShort,
  dateFormat,
  DeepSet,
  teamLink,
} from "../../../lib/helper";

export async function teamMatchup(req: Request) {
  let html = `<h2>Team Matchup</h2>
	Earliest matchup shown, grey and italized means they've only met in a voided match<br><br>`;
  const teams = (await db.select().from(Team)).map((x) => x.team);
  const teamMatrix: Record<string, Record<string, string>> = {};
  const unplayed: Array<{ t1: string; t2: string; days: number }> = [];
  const oldest: Set<{
    t1: string;
    t2: string;
    days: number;
    matchDay: Date;
  }> = new DeepSet();
  const earliest: Record<string, Date> = {};
  const latest: Record<string, Date> = {};
  const unplayedSet: Set<string> = new Set();
  const mostPlayed: Record<string, { t: string; c: number }> = {};
  for (const t of teams) {
    const earliestMatch = await db
      .select()
      .from(Match)
      .innerJoin(Cup, eq(Match.cupID, Cup.cupID))
      .where(
        and(
          or(eq(Match.homeTeam, t), eq(Match.awayTeam, t)),
          eq(Match.official, 1)
        )
      )
      .orderBy(Match.utcTime);
    earliest[t] = earliestMatch[0].match.utcTime;
    latest[t] = earliestMatch[earliestMatch.length - 1].match.utcTime;
    mostPlayed[t] = { t, c: 0 };
  }
  for (const t1 of teams) {
    teamMatrix[t1] = {};
    for (const t2 of teams) {
      if (t1 == t2) continue;
      const match = await db
        .select()
        .from(Match)
        .innerJoin(Cup, eq(Match.cupID, Cup.cupID))
        .where(
          and(
            or(eq(Match.homeTeam, t1), eq(Match.awayTeam, t1)),
            or(eq(Match.homeTeam, t2), eq(Match.awayTeam, t2)),
            eq(Match.official, 1)
          )
        )
        .orderBy(Match.utcTime);
      if (match.length) {
        teamMatrix[t1][t2] = await cupLink(match[0].cup, { format: "short" });
        mostPlayed[t1].c++;
        mostPlayed[t2].c++;
        oldest.add({
          t1: [t1, t2].sort()[0],
          t2: [t1, t2].sort()[1],
          matchDay: match[0].match.utcTime,
          days:
            match[0].match.utcTime.getTime() -
            Math.max(earliest[t1].getTime(), earliest[t2].getTime()),
        });
      } else if (
        (new Date().getTime() -
          Math.min(latest[t1].getTime(), latest[t2].getTime())) /
          86400000 <
        365
      ) {
        const setString = [t1, t2].sort().join("");
        if (!unplayedSet.has(setString)) {
          unplayed.push({
            t1,
            t2,
            days: Math.max(earliest[t1].getTime(), earliest[t2].getTime()),
          });
          unplayedSet.add(setString);
        }
      }
    }
  }
  html += `<table style='border-collapse: collapse;'><tr><th class='sticky-row'></th>`;
  for (const t of teams) {
    html += `<th class='sticky-row'>${teamLink(t, "left")}</th>`;
  }
  html += `<th>Total</th></tr>`;
  for (const t1 of teams) {
    html += `<tr><th class='sticky-col'>${teamLink(t1, "left")}</th>`;
    let c = 0;
    for (const t2 of teams) {
      if (t1 == t2) {
        html += `<td style='background:#2E51A2'></td>`;
      } else {
        if (teamMatrix[t1][t2] !== undefined) {
          html += `<td>${teamMatrix[t1][t2]}</td>`;
          c++;
        } else {
          html += `<td></td>`;
        }
      }
    }
    html += `<td>${c}</td></tr>`;
  }
  html += `</table>`;
  html += `
    <div style='display:inline-block;vertical-align:top' ><h3>Oldest Matchups Yet To Happen</h3>
    <table>
    <tr><th>Cup Debut</th><th colspan=2 >Teams</th><th>Cup Debut</th><th>Days Since</th></tr>`;
  html += unplayed
    .sort((a, b) => {
      if (a.days > b.days) {
        return 1;
      } else if (a.days < b.days) {
        return -1;
      }
      return 0;
    })
    .map((x) => {
      return `<tr><td>${dateFormat(
        earliest[x.t1],
        "med"
      )}</td><td style='text-align:right' >${teamLink(
        x.t1,
        "right"
      )}</td><td style='text-align:left' >${teamLink(
        x.t2,
        "left"
      )}</td><td>${dateFormat(earliest[x.t2], "med")}</td><td>${Math.floor(
        (new Date().getTime() - x.days) / 86400000
      )}</td></tr>`;
    })
    .join("");
  html += `
    </table></div>
    <div style='display:inline-block;vertical-align:top' ><h3>Oldest Matchups To Happen</h3>
    <table>
    <tr><th>Cup Debut</th><th colspan=2 >Teams</th><th>Cup Debut</th><th>Match Day</th><th>Days To Match</th></tr>`;
  html += Array.from(oldest)
    .sort((a, b) => {
      if (a.days > b.days) {
        return -1;
      } else if (a.days < b.days) {
        return 1;
      }
      return 0;
    })
    .filter((x, i) => i < 100)
    .map((x) => {
      return `<tr><td>${dateFormat(
        earliest[x.t1],
        "med"
      )}</td><td style='text-align:right' >${teamLink(
        x.t1,
        "right"
      )}</td><td style='text-align:left' >${teamLink(
        x.t2,
        "left"
      )}</td><td>${dateFormat(earliest[x.t2], "med")}</td><td>${dateFormat(
        x.matchDay,
        "med"
      )}</td><td>${Math.floor(x.days / 86400000)}</td></tr>`;
    })
    .join("");
  html += `
    </table></div>
    <div style='display:inline-block;vertical-align:top' ><h3>Most Matchups</h3>
    <table>
    <tr><th>Team</th><th># Teams Played</th></tr>`;
  html += Object.values(mostPlayed)
    .sort((a, b) => {
      if (a.c > b.c) {
        return -1;
      } else if (a.c < b.c) {
        return 1;
      }
      return 0;
    })
    .filter((x, i) => i < 100)
    .map((x) => {
      return `<tr><td style='text-align:right' >${teamLink(
        x.t,
        "right"
      )}</td><td>${x.c / 2}</td></tr>`;
    })
    .join("");
  html += `
    </table></div>
    <STYLE>
    .sticky-row{
        background:var(--bg-color);
        position:sticky;
        top:0px;
    }
    .sticky-row a img{
        display:block;
        margin:auto;
    }
    .sticky-row a{
        text-align:center;
    }
    .sticky-col{
        background:var(--bg-color);
        position:sticky;
        left:0px;
        height:32px;
    }
    td{
        border:solid 1px black;
        text-align:center;
    }
    tr:hover {
        background-color: #2E51A2;
        color:white;
    }
    </STYLE>`;

  return { html, date: new Date() };
}
