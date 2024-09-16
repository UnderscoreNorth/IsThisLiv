import { Request } from "express";
import { db } from "../../../db";
import { Event, Match, Player, Team } from "../../../db/schema";
import { eq, InferSelectModel } from "drizzle-orm";
import {
  dateFormat,
  goalTypes,
  goalTypesOG,
  playerLink,
  redCardTypes,
  teamLink,
  yellowCardTypes,
} from "../../../lib/helper";

export async function milestoneEvents(req: Request) {
  const events = await db
    .select()
    .from(Event)
    .innerJoin(Player, eq(Player.playerID, Event.playerID))
    .innerJoin(Match, eq(Match.matchID, Event.matchID))
    .where(eq(Match.valid, 1))
    .orderBy(Match.utcTime, Event.regTime, Event.injTime);
  const eObj: Record<
    string,
    Array<{
      event: InferSelectModel<typeof Event>;
      player: InferSelectModel<typeof Player>;
      match: InferSelectModel<typeof Match>;
    }>
  > = {
    goals: [],
    owngoals: [],
    penalties: [],
    eGoals: [],
    cards: [],
    yellows: [],
    reds: [],
  };
  for (const e of events) {
    if (goalTypes.includes(e.event.eventType)) {
      eObj.goals.push(e);
      if (eObj[e.player.team] == undefined) eObj[e.player.team] = [];
      eObj[e.player.team].push(e);
      if (e.event.eventType == 4) eObj.penalties.push(e);
      if ([90, 120].includes(e.event.regTime)) eObj.eGoals.push(e);
    }
    if (goalTypesOG.includes(e.event.eventType)) {
      eObj.goals.push(e);
      eObj.owngoals.push(e);
    }
    if (yellowCardTypes.includes(e.event.eventType)) {
      eObj.yellows.push(e);
      eObj.cards.push(e);
    }
    if (redCardTypes.includes(e.event.eventType)) {
      eObj.reds.push(e);
      eObj.cards.push(e);
    }
  }
  const teams = (await db.select().from(Team).orderBy(Team.team)).map(
    (x) => x.team
  );
  let html = `<h2>Milestone Events</h2>Total goals includes own goals, team goal totals do not.<br><br>
  <table>
    <tr>
        <th>#</th>
        <th>Goals - ${eObj.goals.length}</th>
        <th>Own Goals - ${eObj.owngoals.length}</th>
        <th>Penalties - ${eObj.penalties.length}</th>
        <th>90+/120+ Goals - ${eObj.eGoals.length}</th>
        <th>Cards - ${eObj.cards.length}</th>
        <th>Yellow Cards - ${eObj.yellows.length}</th>
        <th>Red Cards - ${eObj.reds.length}</th>
        ${teams
          .map((x) => {
            if (eObj[x] == undefined) return "";
            return `<th>${teamLink(x, "left")} - ${eObj[x].length}</th>`;
          })
          .join("")}
    </tr>`;
  for (let i = 49; i < eObj.goals.length; i += i >= 999 ? 500 : 50) {
    html += `<tr>
            <td class='stickyCol'>${i + 1}</td>
        <td>${await formatMe(eObj.goals[i])}</td>
        <td>${await formatMe(eObj.owngoals[i])}</td>
        <td>${await formatMe(eObj.penalties[i])}</td>
        <td>${await formatMe(eObj.eGoals[i])}</td>
        <td>${await formatMe(eObj.cards[i])}</td>
        <td>${await formatMe(eObj.yellows[i])}</td>
        <td>${await formatMe(eObj.reds[i])}</td>
        ${(
          await Promise.all(
            teams.map(async (x) => {
              if (eObj[x] == undefined) return "";
              return `<td>${await formatMe(eObj[x][i], false)}</td>`;
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
        min-width:10rem;
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
</STYLE>`;
  return { html, date: new Date() };
  async function formatMe(
    e: {
      event: InferSelectModel<typeof Event>;
      player: InferSelectModel<typeof Player>;
      match: InferSelectModel<typeof Match>;
    },
    team = true
  ) {
    if (e == undefined) return "";
    return `${dateFormat(e.match.utcTime, "med")}
        <br>${await playerLink(
          [e.player.linkID, e.player.name, e.player.team],
          team ? "left" : undefined
        )} - ${
      e.event.regTime + (e.event.injTime >= 0 ? "+" + e.event.injTime : "")
    }'`;
  }
}
