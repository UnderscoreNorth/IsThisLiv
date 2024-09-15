import { Request } from "express";
import { db } from "../../../db";
import { Cup, Event, Match, Performance, Player } from "../../../db/schema";
import { and, desc, eq, gt, inArray, not } from "drizzle-orm";
import {
  cupLink,
  dateFormat,
  goalTypes,
  goalTypesOG,
  playerLink,
  teamLink,
} from "../../../lib/helper";

export async function subbingGKs(req: Request) {
  let html = "<h2>Subbing the Keeper</h2><br>";
  html +=
    "<table><tr><th>Team</th><th>Opponent</th><th>Match</th><th>Subbed At</th><th>First Keeper Result<br>Second Keeper Result</tr>";
  const matches = await db
    .select()
    .from(Performance)
    .innerJoin(Player, eq(Player.playerID, Performance.playerID))
    .innerJoin(Match, eq(Match.matchID, Performance.matchID))
    .innerJoin(Cup, eq(Cup.cupID, Match.cupID))
    .where(
      and(
        eq(Player.regPos, "GK"),
        eq(Match.valid, 1),
        gt(Performance.subOff, 0),
        not(inArray(Performance.subOff, [90, 120]))
      )
    )
    .orderBy(desc(Match.utcTime));
  for (let { performance, player, match, cup } of matches) {
    const team = player.team;
    const subOff = performance.subOff;
    const secondKeeper = (
      await db
        .select()
        .from(Performance)
        .innerJoin(Player, eq(Player.playerID, Performance.playerID))
        .where(
          and(
            eq(Performance.matchID, performance.matchID),
            eq(Player.team, team),
            eq(Performance.subOn, performance.subOff)
          )
        )
        .orderBy(eq(Player.regPos, "GK"))
    )?.[0]?.player ?? { linkID: 0, name: "Unknown", team };
    let hgb = 0,
      hgt = 0,
      agb = 0,
      agt = 0;
    const goals = await db
      .select()
      .from(Event)
      .innerJoin(Player, eq(Event.playerID, Player.playerID))
      .where(
        and(
          eq(Event.matchID, match.matchID),
          inArray(Event.eventType, [...goalTypes, ...goalTypesOG])
        )
      )
      .orderBy(Event.regTime, Event.injTime);
    for (let { event, player } of goals) {
      if (goalTypesOG.includes(event.eventType)) {
        if (player.team == team) {
          agt++;
          if (event.regTime <= subOff) agb++;
        } else {
          hgt++;
          if (event.regTime <= subOff) hgb++;
        }
      } else {
        if (player.team == team) {
          hgt++;
          if (event.regTime <= subOff) hgb++;
        } else {
          agt++;
          if (event.regTime <= subOff) agb++;
        }
      }
    }
    html += `<tr><td>${teamLink(team, "left")}</td><td>${teamLink(
      match.homeTeam == team ? match.awayTeam : match.homeTeam,
      "left"
    )}</td><td>${await cupLink(cup, {
      logo: true,
      format: "long",
      textPos: "after",
      text: ` ${match.round}`,
    })}</td><td>${subOff}</td><td><div`;
    if (hgb > agb) {
      html += " class='W'";
    } else if (hgb == agb) {
      html += " class='D'";
    } else {
      html += " class='L'";
    }
    html += `>${hgb} - ${agb} ${await playerLink([
      player.linkID,
      player.name,
      player.team,
    ])}</div><div`;
    if (hgt > agt) {
      html += " class='W'";
    } else if (hgt == agt) {
      html += " class='D'";
    } else {
      html += " class='L'";
    }
    html += `>${hgt} - ${agt} ${await playerLink([
      secondKeeper.linkID,
      secondKeeper.name,
      secondKeeper.team,
    ])}</div></td></tr>`;
  }
  html += "</table><STYLE>td{text-align:left}</STYLE>";
  return { html, date: new Date() };
}
