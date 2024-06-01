import { Request } from "express";
import { db } from "../../../db";
import { Cup, Event, Match, Player } from "../../../db/schema";
import { and, desc, eq, inArray, not } from "drizzle-orm";
import {
  cupLink,
  cupShort,
  dateFormat,
  goalTypes,
  goalTypesOG,
  teamLink,
} from "../../../lib/helper";

export async function mostDangerousLead(req: Request) {
  let sql = await db
    .select()
    .from(Match)
    .innerJoin(Cup, eq(Match.cupID, Cup.cupID))
    .where(
      and(
        eq(Match.valid, 1),
        eq(Match.official, 1),
        not(eq(Match.winningTeam, "draw")),
        not(eq(Match.round, "Friendly"))
      )
    )
    .orderBy(desc(Match.utcTime));

  /*await DB.query(
    "SELECT *, MatchDB.iMatchID AS 'mID',CupDB.iPes AS 'cPes' FROM MatchDB INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iCupID WHERE bVoided = 1 AND sWinningTeam <> 'draw' AND sRound <> 'Friendly' ORDER BY dUTCTime DESC"
  );*/
  let winners = {};
  let losers = {};
  let cups = {};
  let versions = {};
  let mdl = 2; //Winning threshold
  let html = `
            <h2>Most Dangerous Lead</h2>
            Times a team lost after being up ${mdl}-0<br><br>
            <table style='display:inline-block;vertical-align:top'>
                <tr>
                    <th>Winning Team</th>
                    <th>Losing Team</th>
                    <th>Date</th>
                    <th>Round</th>
                    <th>Result</th>
                    <th>Lead Lost At</th>
                </tr>
        `;
  for (let i in sql) {
    let row = sql[i];
    let team = row.match.winningTeam;
    let losingTeam = "";
    let matchID = row.match.matchID;
    let losingGoals = 0;
    let winningGoals = 0;
    let t2 = 0;
    let mdlCheck = false;
    let time = "";
    let subSql = await db
      .select()
      .from(Event)
      .innerJoin(Player, eq(Player.playerID, Event.playerID))
      .where(
        and(
          inArray(Event.eventType, [...goalTypes, ...goalTypesOG]),
          eq(Event.matchID, row.match.matchID)
        )
      )
      .orderBy(Event.regTime, Event.injTime);
    for (let j in subSql) {
      let subRow = subSql[j];
      //If goal is for the losing team (The team that gets the dangerous lead)
      if (
        (subRow.player.team == team &&
          goalTypesOG.includes(subRow.event.eventType)) ||
        (subRow.player.team != team &&
          !goalTypesOG.includes(subRow.event.eventType))
      ) {
        losingGoals++;
        //Else if winning team scored before the losing team had a dangerous lead
      } else if (losingGoals < mdl) {
        break;
      } else if (losingGoals >= mdl) {
        mdlCheck = true;
        winningGoals++;
        if (losingGoals < winningGoals && !time) {
          let injTime = "";
          if (subRow.event.injTime >= 0) {
            injTime = "+" + subRow.event.injTime;
          } else {
            injTime = "";
          }
          time = subRow.event.regTime + injTime;
        }
      }
    }
    if (mdlCheck) {
      losingTeam =
        team == row.match.homeTeam ? row.match.awayTeam : row.match.homeTeam;
      html += `
                <tr>
                    <td>${teamLink(team, "left")}</td>
                    <td>${teamLink(losingTeam, "left")}</td>
                    <td>${dateFormat(row.match.utcTime)}</td>
                    <td>${row.match.round}</td>
                    <td>${winningGoals} - ${losingGoals}</td>
                    <td>${time}</td>
                </tr>`;
      let cup = await cupLink(row.cup, { logo: true });
      if (typeof winners[team] == "undefined") winners[team] = 0;
      if (typeof losers[losingTeam] == "undefined") losers[losingTeam] = 0;
      if (typeof cups[cup] == "undefined") cups[cup] = 0;
      if (typeof versions[row.cup.pes] == "undefined")
        versions[row.cup.pes] = 0;
      winners[team]++;
      losers[losingTeam]++;
      cups[cup]++;
      versions[row.cup.pes]++;
    }
  }
  html += `</table>`;
  let tables = [
    ["Winning Team", winners, 1],
    ["Losing Team", losers, 1],
    ["Cup", cups, 0],
    ["PES Version", versions, 0],
  ];
  for (let row of tables) {
    let sortable = [];
    for (let i in row[1]) {
      sortable.push([i, row[1][i]]);
    }
    sortable.sort(function (a, b) {
      return b[1] - a[1];
    });
    html += `
                <table style='display:inline-block;vertical-align:top'>
                <tr><th>${row[0]}</th><th>#</th></tr>`;
    for (let e of sortable) {
      html += `<tr><td>${row[2] ? teamLink(e[0], "left") : e[0]}</td><td>${
        e[1]
      }</td></tr>`;
    }
    html += `</table>`;
  }
  html += `
        <STYLE>
            table td{
                text-align:left;
            }
            table{
                margin-right:2rem;
                padding:1rem;
            }
        </STYLE>`;
  return { html, date: new Date() };
}
