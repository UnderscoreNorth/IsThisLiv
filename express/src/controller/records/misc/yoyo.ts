import { Request } from "express";
import { db } from "../../../db";
import { Cup, Match, Team } from "../../../db/schema";
import { and, eq, lte, min, or } from "drizzle-orm";
import { keySort, teamLink } from "../../../lib/helper";

export async function yoyo(req: Request) {
  const teams = await db.select().from(Team);
  const minCups = 4;
  let html = `<h2>Yoyoing</h2>
    Every continuous streak (${minCups}+) of cup appearances<br><br>`;
  let instances: Array<{ c: number; t: string; first: string; last: string }> =
    [];
  for (const { team } of teams) {
    const cups = await db
      .select({ season: Cup.season, year: Cup.year })
      .from(Cup)
      .innerJoin(Match, eq(Cup.cupID, Match.cupID))
      .where(
        and(
          or(eq(Match.homeTeam, team), eq(Match.awayTeam, team)),
          eq(Match.official, 1),
          lte(Cup.cupType, 3)
        )
      )
      .orderBy(min(Cup.start))
      .groupBy(Cup.season, Cup.year);
    let arr = [];
    for (const cup of cups) {
      if (arr.length) {
        const last = arr[arr.length - 1];
        if (nextS(last[1]) !== cup.season) {
          if (arr.length >= minCups) {
            instances.push({
              t: team,
              c: arr.length,
              first: `${arr[0][0]} ${arr[0][1]}`,
              last: `${cup.year} ${cup.season}`,
            });
          }
          arr = [];
        }
      }
      arr.push([cup.year, cup.season]);
    }
    if (arr.length >= minCups) {
      const last = arr[arr.length - 1];
      instances.push({
        t: team,
        c: arr.length,
        first: `${arr[0][0]} ${arr[0][1]}`,
        last: `${last[0]} ${last[1]}`,
      });
    }
  }
  instances = keySort(instances, "c", true);
  html += `<table><tr><th># Cups</th><th>Board</th><th>First Cup</th><th>Last Cup</th></tr>`;
  html += instances
    .map((x) => {
      return `<tr><td>${x.c}</td><td style='text-align:right' >${teamLink(
        x.t,
        "right"
      )}</td><td>${x.first}</td><td>${x.last}</td></tr>`;
    })
    .join("");
  html += `</table>`;
  return { html, date: new Date() };
}
function nextS(season: string) {
  switch (season) {
    case "Summer":
      return "Autumn";
    case "Autumn":
      return "Winter";
    case "Winter":
      return "Spring";
    case "Spring":
      return "Summer";
  }
}
