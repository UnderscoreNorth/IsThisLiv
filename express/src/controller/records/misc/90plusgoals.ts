import { and, desc, eq, inArray, InferSelectModel } from "drizzle-orm";
import { db } from "../../../db";
import { Cup, Event, Match, Player } from "../../../db/schema";
import {
  cupLink,
  dateFormat,
  goalTypes,
  goalTypesOG,
  playerLink,
  teamLink,
} from "../../../lib/helper";
import { Request } from "express";

export async function ninetyplusgoals(req: Request) {
  let html = "";
  let matches = await db
    .select()
    .from(Event)
    .innerJoin(Match, eq(Event.matchID, Match.matchID))
    .innerJoin(Cup, eq(Cup.cupID, Match.cupID))
    .where(
      and(
        inArray(Event.eventType, [...goalTypes, ...goalTypesOG]),
        inArray(Event.regTime, [90, 120]),
        eq(Match.valid, 1)
      )
    )
    .orderBy(desc(Match.utcTime));
  let teamsObj: Record<string, { team: string; num: number }> = {};
  let playerObj: Record<string, { linkID: number; num: number }> = {};
  let matchArr: Array<{
    match: InferSelectModel<typeof Match>;
    cup: InferSelectModel<typeof Cup>;
    homeGoals: number;
    awayGoals: number;
    goal: {
      player: InferSelectModel<typeof Player>;
      event: InferSelectModel<typeof Event>;
    };
  }> = [];
  let matchIDs: Set<number> = new Set();
  for (const { match, cup } of matches) {
    if (matchIDs.has(match.matchID) == false) {
      matchIDs.add(match.matchID);
      let goals = await db
        .select()
        .from(Event)
        .innerJoin(Player, eq(Event.playerID, Player.playerID))
        .where(
          and(
            inArray(Event.eventType, [...goalTypes, ...goalTypesOG]),
            eq(Event.matchID, match.matchID)
          )
        )
        .orderBy(Event.regTime, Event.injTime);

      let homeGoals = 0;
      let awayGoals = 0;
      for (const goal of goals) {
        if (goalTypes.includes(goal.event.eventType)) {
          if (goal.player.team == match.homeTeam) {
            homeGoals++;
          } else {
            awayGoals++;
          }
        } else {
          if (goal.player.team == match.homeTeam) {
            awayGoals++;
          } else {
            homeGoals++;
          }
        }
      }
      let goal = goals[goals.length - 1];
      if (
        Math.abs(homeGoals - awayGoals) <= 1 &&
        (goal.player.team == match.winningTeam || match.winningTeam == "draw")
      ) {
        matchArr.push({
          match,
          cup,
          homeGoals,
          awayGoals,
          goal,
        });
        if (teamsObj[goal.player.team] == undefined)
          teamsObj[goal.player.team] = { team: goal.player.team, num: 0 };
        teamsObj[goal.player.team].num++;
        if (playerObj[goal.player.linkID] == undefined)
          playerObj[goal.player.linkID] = {
            linkID: goal.player.linkID,
            num: 0,
          };
        playerObj[goal.player.linkID].num++;
      }
    }
  }
  html = `
  <h2>90+ Goals</h2>
            Times a team has won or drawn a game with a 90+ or 120+ goal<br><br>
  <table>
    <tr>
        <th colspan=2><br>Match</th>
        <th colspan=3><br>Score</th>
        <th><br>Goal</th>
        <th><br>Player</th>
    </tr>
  ${(
    await Promise.all(
      matchArr.map(async (x) => {
        return `<tr>
        <td>${await cupLink(x.cup, { logo: true, format: "short" })}</td>
        <td style='text-align:left' >${x.match.round}</td>
        <td>${teamLink(x.match.homeTeam, "right")}</td>
        <td>${x.homeGoals} - ${x.awayGoals}</td>
        <td style='text-align:left' >${teamLink(x.match.awayTeam, "left")}</td>
        <td>${x.goal.event.regTime}+${x.goal.event.injTime}'</td>
        <td style='text-align:left' >${await playerLink(
          x.goal.player.linkID
        )}</td>
      </tr>`;
      })
    )
  ).join("")}
  </table>
    <table>
    <tr>
        <th><br>Board</th>
        <th>Times<br>won/drawn</th>
    </tr>
    ${Object.values(teamsObj)
      .sort((a, b) => {
        if (a.num > b.num) return -1;
        if (a.num < b.num) return 1;
        return 0;
      })
      .map((x) => {
        return `<tr>
            <td>${teamLink(x.team, "right")}</td>
            <td>${x.num}</td>
        </tr>
        `;
      })
      .join("")}
    </table>
    <table>
    <tr>
        <th><br>Player</th>
        <th>Times<br>won/drawn</th>
    </tr>
    ${(
      await Promise.all(
        Object.values(playerObj)
          .sort((a, b) => {
            if (a.num > b.num) return -1;
            if (a.num < b.num) return 1;
            return 0;
          })
          .filter((x) => x.num >= 3)
          .map(async (x) => {
            return `<tr>
            <td>${await playerLink(x.linkID, "right")}</td>
            <td>${x.num}</td>
        </tr>
        `;
          })
      )
    ).join("")}
    </table>
    <style>
      table{
      display:inline-block;
      vertical-align:top
      }
    </style>`;
  return { html, date: new Date() };
}
