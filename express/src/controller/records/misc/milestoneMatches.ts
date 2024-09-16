import { Request } from "express";
import { db } from "../../../db";
import { Cup, Match, Team } from "../../../db/schema";
import { eq, InferSelectModel } from "drizzle-orm";
import {
  cupLink,
  dateFormat,
  goalTypes,
  goalTypesOG,
  playerLink,
  redCardTypes,
  teamLink,
  yellowCardTypes,
} from "../../../lib/helper";

export async function milestoneMatches(req: Request) {
  const matches = await db
    .select()
    .from(Match)
    .innerJoin(Cup, eq(Match.cupID, Cup.cupID))
    .where(eq(Match.official, 1))
    .orderBy(Match.utcTime);
  const mObj: Record<
    string,
    Array<{
      cup: InferSelectModel<typeof Cup>;
      match: InferSelectModel<typeof Match>;
    }>
  > = {
    all: [],
    eTime: [],
    benuldies: [],
  };
  for (const e of matches) {
    mObj.all.push(e);
    if (e.match.endPeriod >= 2) mObj.eTime.push(e);
    if (e.match.endPeriod == 3) mObj.benuldies.push(e);
    for (const team of [e.match.homeTeam, e.match.awayTeam]) {
      if (mObj[team] == undefined) mObj[team] = [];
      mObj[team].push(e);
    }
  }
  const teams = (await db.select().from(Team).orderBy(Team.team)).map(
    (x) => x.team
  );
  let html = `<h2>Milestone Matches</h2>Grey matches have not occurred yet.<br><br>
  <table>
    <tr>
        <th>#</th>
        <th>All - ${mObj.all.length}</th>
        <th>Extra Time - ${mObj.all.length}</th>
        <th>Benuldies - ${mObj.benuldies.length}</th>
        ${teams
          .map((x) => {
            if (mObj[x] == undefined) return "";
            return `<th>${teamLink(x, "left")} - ${mObj[x].length}</th>`;
          })
          .join("")}
    </tr>`;
  for (let i = 9; i < mObj.all.length; i += i >= 499 ? 500 : 10) {
    html += `<tr>
            <td class='stickyCol'>${i + 1}</td>
        ${await formatMe(mObj.all[i])}
        ${await formatMe(mObj.eTime[i])}
        ${await formatMe(mObj.benuldies[i])}
        ${(
          await Promise.all(
            teams.map(async (x) => {
              if (mObj[x] == undefined) return "";
              return `${await formatMe(mObj[x][i], x)}`;
            })
          )
        ).join("")}
    </tr>
        `;
  }
  html += `</table><STYLE>
    table{
        border-collapse:collapse
    }
    td:not(:first-child){
        text-align:center;
        min-width:7rem;
    }
    td,th{
        border-bottom:1px solid var(--fg-color);
    }
    th{
        top:0;
        z-index:2;
    }
    .stickyCol{
        left:0;
        z-index:1;
    }
    th, .stickyCol{
        position:sticky;
        background:var(--bg-color);
    }
    .straight{
        white-space:nowrap;
    }
</STYLE>`;
  return { html, date: new Date() };
  async function formatMe(
    e: {
      cup: InferSelectModel<typeof Cup>;
      match: InferSelectModel<typeof Match>;
    },
    team = ""
  ) {
    if (e == undefined) return "<td></td>";
    return `<td class='${
      team
        ? e.match.winningTeam == ""
          ? "V"
          : e.match.winningTeam == "draw"
          ? "D"
          : e.match.winningTeam == team
          ? "W"
          : "L"
        : ""
    }' style='${e.match.valid ? "" : "text-decoration: line-through;"}'>
        ${await cupLink(e.cup, { format: "short" })}
        <br>${e.match.round}
        <br><div class='straight'>${
          team
            ? teamLink(
                e.match.homeTeam == team ? e.match.awayTeam : e.match.homeTeam,
                "left"
              )
            : teamLink(e.match.homeTeam, "right") +
              " - " +
              teamLink(e.match.awayTeam, "left")
        }</div></td>`;
  }
}
