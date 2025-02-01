import { Request } from "express";
import { db } from "../../../db";
import {
  Event,
  Match,
  Performance,
  Player,
  PlayerLink,
} from "../../../db/schema";
import {
  and,
  avg,
  count,
  desc,
  eq,
  gt,
  inArray,
  InferSelectModel,
  max,
  min,
  not,
  or,
} from "drizzle-orm";
import { cupLink, goalTypes, playerLink, teamLink } from "../../../lib/helper";

export async function allMedalScoring(req: Request) {
  let html = `<h2>All Medals Scoring</h2>
        Matches where all the medals of a team scored.<br><br>
        <table><tr><th>Team</th><th>Opponent</th><th>Match</th><th>Medals</th></tr>`;

  const matches = await db
    .select()
    .from(Match)
    .where(eq(Match.official, 1))
    .orderBy(desc(Match.utcTime));
  const players: Record<
    string,
    Record<string, Array<InferSelectModel<typeof Player>>>
  > = {};
  await db
    .select()
    .from(Player)
    .where(and(not(eq(Player.medal, ""))))
    .orderBy(Player.medal)
    .then((r) => {
      for (const player of r) {
        if (players[player.cupID] == undefined) players[player.cupID] = {};
        const cup = players[player.cupID];
        if (cup[player.team] == undefined) cup[player.team] = [];
        const team = cup[player.team];
        team.push(player);
      }
    });
  const teams: Record<string, number> = {};
  for (const match of matches) {
    for (const team of [match.homeTeam, match.awayTeam]) {
      if (players?.[match.cupID]?.[team] == undefined) continue;
      const medals = players[match.cupID][team];
      if (medals.length < 4) continue;
      let allScored = true;
      let goalText = [];
      for (const player of medals) {
        let text = `<div class='${player.medal}'>${await playerLink([
          player.linkID,
          player.name,
          player.team,
        ])} `;
        let goals = await db
          .select()
          .from(Event)
          .where(
            and(
              inArray(Event.eventType, goalTypes),
              eq(Event.playerID, player.playerID),
              eq(Event.matchID, match.matchID)
            )
          )
          .orderBy(Event.regTime, Event.injTime);
        if (goals.length == 0) {
          allScored = false;
          break;
        } else {
          text +=
            goals
              .map((x) => {
                let text = x.regTime.toString();
                if (x.injTime >= 0) text += "+" + x.injTime;
                text += "'";
                return text;
              })
              .join(", ") + "</div>";
        }

        goalText.push(text);
      }
      if (allScored) {
        if (teams[team] == undefined) teams[team] = 0;
        teams[team]++;
        html += `<tr>
          <td>${teamLink(team, "left")}</td>
          <td>${teamLink(
            team == match.homeTeam ? match.awayTeam : match.homeTeam,
            "left"
          )}</td>
          <td>${await cupLink(match.cupID, {
            logo: true,
            format: "long",
            textPos: "after",
            text: ` ${match.round}`,
          })}</td>
          <td>${goalText.join("")}</td>
        </tr>`;
      }
    }
  }
  html += "</table><STYLE>td{text-align:left;padding-bottom:5px;}</STYLE>";
  return { html, date: new Date() };
}
