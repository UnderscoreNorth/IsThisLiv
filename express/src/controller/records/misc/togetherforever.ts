import { Request } from "express";
import { db } from "../../../db";
import { Cup, Match, Team } from "../../../db/schema";
import { and, eq, InferSelectModel, lte, max, or } from "drizzle-orm";
import { cupLink, DeepSet, keySort, teamLink } from "../../../lib/helper";

export async function togetherForever(req: Request) {
  const teams = (await db.select().from(Team)).map((x) => x.team);
  let teamCups: Record<string, Array<InferSelectModel<typeof Cup>>> = {};
  for (const team of teams) {
    teamCups[team] = (
      await db
        .select({ Cup })
        .from(Cup)
        .innerJoin(Match, eq(Match.cupID, Cup.cupID))
        .where(
          and(
            or(eq(Match.homeTeam, team), eq(Match.awayTeam, team)),
            lte(Cup.cupType, 2)
          )
        )
        .groupBy(Cup.cupID)
        .orderBy(Cup.start)
    ).map((x) => x.Cup);
  }
  let list: Set<{
    num: number;
    t1: string;
    t2: string;
    first: InferSelectModel<typeof Cup>;
    last: InferSelectModel<typeof Cup>;
  }> = new DeepSet();
  for (const t1 of teams) {
    let currArr: Record<
      string,
      {
        first: InferSelectModel<typeof Cup>;
        last: InferSelectModel<typeof Cup>;
        num: number;
        index: number;
        team: string;
      }
    > = {};
    for (const cup of teamCups[t1]) {
      for (const t2 of teams) {
        if (t1 == t2) continue;
        let index = teamCups[t2].map((x) => x.cupID).indexOf(cup.cupID);
        let fail = false;
        if (index == -1) {
          fail = true;
        } else {
          if (currArr[t2] == undefined) {
            currArr[t2] = {
              first: cup,
              last: cup,
              num: 1,
              index,
              team: t2,
            };
          } else {
            if (teamCups[t2][currArr[t2].index + 1]?.cupID == cup.cupID) {
              currArr[t2].index++;
              currArr[t2].num++;
              currArr[t2].last = cup;
            } else {
              fail = true;
            }
          }
        }
        if (fail) {
          if (currArr[t2] !== undefined && currArr[t2].num >= 5) {
            list.add({
              num: currArr[t2].num,
              t1: [t1, t2].sort()[0],
              t2: [t1, t2].sort()[1],
              first: currArr[t2].first,
              last: currArr[t2].last,
            });
          }
          currArr[t2] = undefined;
        }
      }
    }
    for (const t2 of teams) {
      if (t1 == t2) continue;
      if (currArr[t2] !== undefined && currArr[t2].num >= 5) {
        list.add({
          num: currArr[t2].num,
          t1: [t1, t2].sort()[0],
          t2: [t1, t2].sort()[1],
          first: currArr[t2].first,
          last: currArr[t2].last,
        });
      }
    }
  }
  let html = `<h2>Together Forever</h2>Teams that promoted and relegated together at least 5 consecutive times.<br><br>
  <table>
    <tr><th># Cups</th><th colspan=2 >Teams</th><th>First Cup</th><th>Last Cup</th></tr>
    ${(
      await Promise.all(
        keySort(Array.from(list), "num", true).map(async (x) => {
          return `<tr><td>${x.num}</td><td>${teamLink(
            x.t1,
            "right"
          )}</td><td style='text-align:left'>${teamLink(
            x.t2,
            "left"
          )}</td><td>${await cupLink(x.first, {
            logo: true,
            format: "long",
          })}</td><td>${await cupLink(x.last, {
            logo: true,
            format: "long",
          })}</td></tr>`;
        })
      )
    ).join("")}
  </table>
  <style>
    img{max-height:1.5rem}
  </style>
  `;
  return { html, date: new Date() };
}
