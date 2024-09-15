import { Request } from "express";
import { db } from "../../../db";
import { Cup, Event, Match, Performance, Player } from "../../../db/schema";
import {
  and,
  eq,
  gt,
  inArray,
  InferSelectModel,
  lte,
  not,
  or,
} from "drizzle-orm";
import {
  cupLink,
  keySort,
  playerLink,
  pos,
  teamLink,
} from "../../../lib/helper";

export async function benchedMedals(req: Request) {
  let players = await db
    .select()
    .from(Player)
    .innerJoin(Cup, eq(Player.cupID, Cup.cupID))
    .where(
      and(not(eq(Player.medal, "")), lte(Cup.cupType, 3), gt(Cup.cupID, 2))
    );
  let arr: Array<{
    date: Date;
    player: InferSelectModel<typeof Player>;
    match: InferSelectModel<typeof Match>;
    cup: InferSelectModel<typeof Cup>;
    dnp: String;
  }> = [];
  for (let { player, cup } of players) {
    const pID = player.playerID;
    const cID = player.cupID;
    const team = player.team;
    const matches = await db
      .select()
      .from(Match)
      .where(
        and(
          or(eq(Match.homeTeam, team), eq(Match.awayTeam, team)),
          eq(Match.cupID, cID),
          eq(Match.valid, 1),
          eq(Match.official, 1),
          not(eq(Match.winningTeam, ""))
        )
      );
    for (let match of matches) {
      let dnp = "";
      const perf = await db
        .select()
        .from(Performance)
        .where(
          and(
            eq(Performance.matchID, match.matchID),
            eq(Performance.playerID, pID)
          )
        );
      if (
        perf.filter(
          (x) => [0, -1].includes(x.subOn) && [90, 120, -1].includes(x.subOff)
        ).length == 0
      ) {
        dnp = "Benched";
        if (perf.length !== 0) {
          const subOffEvent = await db
            .select()
            .from(Event)
            .where(
              and(
                eq(Event.matchID, match.matchID),
                eq(Event.playerID, pID),
                inArray(Event.eventType, [6, 7, 8])
              )
            );
          if (subOffEvent.length > 0) {
            switch (subOffEvent[0].eventType) {
              case 6:
              case 8:
                dnp = "Carded off";
                break;
              case 7:
                dnp = "Killed off";
                break;
              default:
                break;
            }
            dnp += " at " + subOffEvent[0].regTime;
          }
          if (dnp == "Benched") {
            dnp = "";
            if (perf[0].subOn > 0) {
              dnp += "Subbed on at " + perf[0].subOn;
            }
            if (![90, 120, -1].includes(perf[0].subOff)) {
              if (dnp == "") {
                dnp += "S";
              } else {
                dnp += ", s";
              }
              dnp += "ubbed off at " + perf[0].subOff;
            }
          }
        }
      }
      if (dnp) {
        arr.push({ date: match.utcTime, player, match, dnp, cup });
      }
    }
  }
  arr = keySort(arr, "date", true);
  let html = `<h2>Benched Medals</h2>
    <table>
        <tr>
            <th>Player</th>
            <th>Pos</th>
            <th>Match</th>
            <th>Opponent</th>
            <th>Status</th>
        </tr>`;
  for (let { match, dnp, player, cup } of arr) {
    html += `<tr class=${
      match.winningTeam == player.team
        ? "W"
        : match.winningTeam == "draw"
        ? "D"
        : "L"
    }>
            <td class='${player.medal}'>${await playerLink(
      [player.linkID, player.name, player.team],
      "right"
    )}</td><td>${pos(
      player.regPos
    )}</td><td style='text-align:left'>${await cupLink(cup, {
      logo: true,
      format: "short",
      textPos: "after",
      text: match.round,
    })}</td><td style='text-align:left'>${teamLink(
      match.homeTeam == player.team ? match.awayTeam : match.homeTeam,
      "left"
    )}</td><td>${dnp}</td></tr>`;
  }
  html += `</table>
  <style>
    .W a, .D a, .L a{
    color:black;}
  </style>`;
  return { html, date: new Date() };
}
