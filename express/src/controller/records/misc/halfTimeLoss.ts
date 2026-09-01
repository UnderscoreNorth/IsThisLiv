import { and, desc, eq, gte, inArray, InferSelectModel } from "drizzle-orm";
import { db } from "../../../db";
import { Cup, Event, Match, Player } from "../../../db/schema";
import {
  cupLink,
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
    .from(Match)
    .where(and(eq(Match.valid, 1)))
    .orderBy(desc(Match.utcTime));
  let matchObj:Record<string,{'Kept Lead':Record<string,number>,'Drew':Record<string,number>,'Lost Lead':Record<string,number>}>;

  for (const match of matches) {
  
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

      let homeGoalsBeforeHalf = 0;
      let awayGoalsBeforeHalf = 0;
      let homeGoalsAfterHalf = 0;
      let awayGoalsAfterHalf = 0;
      for (const goal of goals) {
        if (goalTypes.includes(goal.event.eventType)) {
          if (goal.player.team == match.homeTeam) {
            goal.event.regTime > 45
              ? homeGoalsAfterHalf++
              : homeGoalsBeforeHalf++;
          } else {
            goal.event.regTime > 45
              ? awayGoalsAfterHalf++
              : awayGoalsBeforeHalf++;
          }
        } else {
          if (goal.player.team == match.homeTeam) {
            goal.event.regTime > 45
              ? awayGoalsAfterHalf++
              : awayGoalsBeforeHalf++;
          } else {
            goal.event.regTime > 45
              ? homeGoalsAfterHalf++
              : homeGoalsBeforeHalf++;
          }
        }
      }
      let homeGoalsFinal = homeGoalsBeforeHalf + homeGoalsAfterHalf;
      let awayGoalsFinal = awayGoalsBeforeHalf + awayGoalsAfterHalf;
      if (homeGoalsBeforeHalf == awayGoalsBeforeHalf) continue;
      let initialScore = "";
      let finalScore = "";
      let finalResult = "";
      let leadGoalsBeforeHalf = 0;
      let loserGoalsBeforeHalf = 0;
      let leadGoalsFinal = 0;
      let loserGoalsFinal = 0;
      if (homeGoalsBeforeHalf > awayGoalsBeforeHalf) {
        leadGoalsBeforeHalf = homeGoalsBeforeHalf;
        loserGoalsBeforeHalf = awayGoalsBeforeHalf;
        leadGoalsFinal = homeGoalsFinal;
        loserGoalsFinal = awayGoalsFinal;
      } else {
        leadGoalsBeforeHalf = awayGoalsBeforeHalf;
        loserGoalsBeforeHalf = homeGoalsBeforeHalf;
        leadGoalsFinal = awayGoalsFinal;
        loserGoalsFinal = homeGoalsFinal;
      }
      initialScore = leadGoalsBeforeHalf + " - " + loserGoalsBeforeHalf;
      finalScore = loserGoalsFinal + " - " + loserGoalsFinal;
      if (loserGoalsFinal > loserGoalsFinal) {
        finalResult = "Kept lead";
      } else if (loserGoalsFinal == loserGoalsFinal) {
        finalResult = "Drew";
      } else {
        finalResult = "Lost lead";
      }
      if(matchObj[initialScore] == undefined) matchObj[initialScore] = {
        'Drew':{},
        'Kept Lead':{},
        'Lost Lead':{}
      }
      if(matchObj[initialScore][finalResult][finalScore] == undefined) matchObj[initialScore][finalResult][finalScore] = 0;
      matchObj[initialScore][finalResult][finalScore]++
    
  }
  html = `
  <h2>Losing at half time</h2>
            I'm sorry, but did the Chargers already lose? Oh, that’s right. The game isn’t even over yet. In fact, it’s only halftime. Does not having the lead at halftime count as a loss? Is that what you’re saying? Because if you’re saying that I can assure you that you’re wrong. Why would you make this topic when the game is still on? The Chargers are still playing right now and they have been the best team in the AFC West for how many years now? They’re playing one of the worst teams in the NFL who just happen to have a lead because they’re feeding off the energy of playing in a Monday Night Game. But you know what? They still fucking suck. The Chargers are one of the best fucking teams in the NFL, they went 13-3 last year and would of won the Super Bowl if the kicker didn’t choke. Maybe you should shut the fuck up before you make retarded topics like this. You know why? Because you’re going to be embarrassed when the Chargers wins and someone bumps this topic. Oh look at that, the Chiefs just stepped out of bounds short of the 1st down when they needed to get one, just like the Jets did. Why don’t you try to be a good poster? Just for once? For once in your fucking life try not to make a topic like this. That’s just you, you’re always right at getting it wrong. Fuck you. You are nothing.<br><br>
  <table>
    <tr>
        <th>Result at Half time</th>
        <th>Team Kept Lead?</th>
        <th>Final Result</th>
        <th>#</th>
    </tr>
  ${(
      Object.entries(matchObj).map(([initialResult,data]) => {
        return `<tr>
        <td>${initialResult}</td>
        <td>${Object.entries(data).map(([finalResult,subData])=>{
            return ${Object.entries(subData).map(([finalScore,num])=>{
                `<tr><td>`
            })
        }).join('')}</td>
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
        <th><br>Board</th>
        <th>Times<br>lost/drawn</th>
    </tr>
    ${Object.values(losingTeamsObj)
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
