import { Request } from "express";
import { Match, Stadiums } from "../../../db/schema";
import { db } from "../../../db";
import { and, eq, not } from "drizzle-orm";
import { keySort, keySortMulti, teamLink } from "../../../lib/helper";

export async function stadiums(req: Request) {
  const matches = await db
    .select()
    .from(Match)
    .innerJoin(Stadiums, eq(Match.stadium, Stadiums.alias))
    .where(and(eq(Match.official, 1), not(eq(Match.stadium, ""))));
  let stadiumObj: Record<
    string,
    {
      stadium: string;
      num: number;
      teams: Record<string, { w: number; l: number; d: number }>;
    }
  > = {};
  for (const { match, stadium } of matches) {
    const s = stadium.stadium;
    if (stadiumObj[s] == undefined)
      stadiumObj[s] = {
        stadium: stadium.stadium,
        num: 0,
        teams: {},
      };
    stadiumObj[s].num++;
    for (const team of [match.homeTeam, match.awayTeam]) {
      if (stadiumObj[s].teams[team] == undefined)
        stadiumObj[s].teams[team] = { w: 0, d: 0, l: 0 };
      if (match.winningTeam == "") continue;
      if (match.winningTeam == team) {
        stadiumObj[s].teams[team].w++;
      } else if (match.winningTeam == "draw") {
        stadiumObj[s].teams[team].d++;
      } else {
        stadiumObj[s].teams[team].l++;
      }
    }
  }
  const stadiums = keySort(Object.values(stadiumObj), "num", true);
  let eff: Array<{ team: string; stadium: string; num: number; eff: number }> =
    [];
  for (const stadium of stadiums) {
    for (const team in stadium.teams) {
      const t = stadium.teams[team];
      const total = t.w + t.d + t.l;
      if (total <= 3) continue;
      const e = t.w / total;
      eff.push({ team: team, stadium: stadium.stadium, num: total, eff: e });
    }
  }
  let html = `<h2>Stadiums</h2>
    <div class='cat'>
        <h3>Most Played</h3>
        <table>
            <tr>
                <th>#</th>
                <th>Stadium</th>
                <th># Matches</th>
            </tr>
        ${stadiums
          .map(
            (x, i) =>
              `<tr><td>${i + 1}</td><td>${x.stadium}</td><td>${x.num}</td></tr>`
          )
          .join("")}
        </table>
    </div>
    <div class='cat'>
        <h3>Best Showings (Min 4 matches)</h3>
        <table>
            <tr>
                <th>#</th>
                <th>Team</th>
                <th>Stadium</th>
                <th># Matches</th>
                <th>Eff %</th>
            </tr>
        ${keySortMulti(eff, [
          { key: "eff", descending: true },
          { key: "num", descending: true },
        ])
          .filter((x) => x.eff >= 0.5)
          .map(
            (x, i) =>
              `<tr><td>${i + 1}</td><td>${teamLink(x.team, "left")}</td><td>${
                x.stadium
              }</td><td>${x.num}</td><td>${
                Math.round(x.eff * 10000) / 100
              }%</td></tr>`
          )
          .join("")}
        </table>
    </div>
    <div class='cat'>
        <h3>NO REFUNDS (Min 4 matches)</h3>
        <table>
            <tr>
                <th>#</th>
                <th>Team</th>
                <th>Stadium</th>
                <th># Matches</th>
                <th>Eff %</th>
            </tr>
        ${keySortMulti(eff, [{ key: "eff" }, { key: "num", descending: true }])
          .filter((x) => x.eff < 0.34)
          .map(
            (x, i) =>
              `<tr><td>${i + 1}</td><td>${teamLink(x.team, "left")}</td><td>${
                x.stadium
              }</td><td>${x.num}</td><td>${
                Math.round(x.eff * 10000) / 100
              }%</td></tr>`
          )
          .join("")}
        </table>
    </div>
    <STYLE>
          .cat{
            display:inline-block;
            vertical-align:top;
            margin: 0 1rem;
        }
          td{
          text-align:left}
    </STYLE>`;
  return { html, date: new Date() };
}
