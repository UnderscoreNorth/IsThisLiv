import { Request } from "express";
import { db } from "../../../db";
import { Cup, Match, Player, Team } from "../../../db/schema";
import { and, desc, eq, gte, InferSelectModel, lte, or } from "drizzle-orm";
import { cupLink, playerLink } from "../../../lib/helper";

export async function playersByCupDebut(req: Request) {
  const cupThreshold = (
    await db
      .select()
      .from(Cup)
      .where(lte(Cup.cupType, 3))
      .orderBy(desc(Cup.start))
  )[0].cupID;
  const teams = (
    await db
      .select({ homeTeam: Match.homeTeam })
      .from(Match)
      .where(and(eq(Match.official, 1), gte(Match.cupID, cupThreshold)))
      .groupBy(Match.homeTeam)
  ).map((x) => x.homeTeam);
  const teamColours = await db
    .select()
    .from(Team)
    .then((r) => {
      let t: Record<string, string> = {};
      for (let o of r) {
        t[o.team] = o.primaryHex;
      }
      return t;
    });
  const cups: Record<
    number,
    Array<{ player: InferSelectModel<typeof Player>; unbroken: boolean }>
  > = {};
  const years: Record<
    number,
    { year: number; total: number; team: Record<string, number> }
  > = {};
  let total = 0;
  for (const team of teams) {
    const latestCup = (
      await db
        .select()
        .from(Match)
        .where(
          and(
            eq(Match.official, 1),
            or(eq(Match.homeTeam, team), eq(Match.awayTeam, team))
          )
        )
        .orderBy(desc(Match.utcTime))
    )[0].cupID;
    const players = await db
      .select()
      .from(Player)
      .where(and(eq(Player.cupID, latestCup), eq(Player.team, team)));
    for (const player of players) {
      const firstCup = (
        await db
          .select({ cupID: Player.cupID, year: Cup.year })
          .from(Player)
          .innerJoin(Cup, eq(Player.cupID, Cup.cupID))
          .where(eq(Player.linkID, player.linkID))
          .orderBy(Player.cupID)
      )[0];
      if (firstCup === undefined) continue;
      const playerCups = await db
        .select({ Cup })
        .from(Match)
        .innerJoin(Cup, eq(Cup.cupID, Match.cupID))
        .where(
          and(
            eq(Match.official, 1),
            or(eq(Match.homeTeam, team), eq(Match.awayTeam, team)),
            lte(Cup.cupType, 3),
            gte(Cup.cupID, firstCup.cupID)
          )
        )
        .groupBy(Cup.cupID)
        .orderBy(Cup.start);
      let unbroken = true;
      for (const cup of playerCups) {
        if (
          (
            await db
              .select()
              .from(Player)
              .where(
                and(
                  eq(Player.linkID, player.linkID),
                  eq(Player.cupID, cup.Cup.cupID)
                )
              )
          ).length == 0
        ) {
          unbroken = false;
          break;
        }
      }
      if (cups[firstCup.cupID] == undefined) cups[firstCup.cupID] = [];
      cups[firstCup.cupID].push({ player, unbroken });
      if (years[firstCup.year] == undefined)
        years[firstCup.year] = { year: firstCup.year, total: 0, team: {} };
      years[firstCup.year].total++;
      if (years[firstCup.year].team[team] == undefined)
        years[firstCup.year].team[team] = 0;
      years[firstCup.year].team[team]++;
      total++;
    }
  }

  let html = `<h2>Players by Debut Cup</h2>Players from active teams listed by their first cup, not including friendlies. Players with breaks in their career have been underlined.<br><br>`;
  html += `<div style='font-size:x-small;text-align:center;'>${Object.values(
    years
  )
    .map((x, i) => {
      return `<div style='width:${
        (x.total / total) * 100
      }%;display:inline-block;'><div style='white-space:nowrap'>${x.year} (${
        Math.round((x.total / total) * 1000) / 10
      }%)</div><div style='background:hsl(${
        i * 60
      },50%,50%);height:1rem;border: solid 1px var(--bg-color);'></div>
      <div style='border: solid 1px var(--bg-color);'>${Object.entries(x.team)
        .map((y) => {
          return `<div style='display:inline-block;height:0.5rem;background:#${
            teamColours[y[0]]
          };width:${(y[1] / x.total) * 100}%'></div>`;
        })
        .join("")}</div>
      </div>`;
    })
    .join("")}</div>`;
  for (let cupID in cups) {
    const players = cups[cupID];
    const cup = (
      await db
        .select()
        .from(Cup)
        .where(eq(Cup.cupID, parseInt(cupID)))
    )[0];
    html += `<h3>${await cupLink(cup, { logo: true, format: "long" })}</h3>`;
    for (const player of players) {
      html += `<div class='player ${
        player.unbroken ? "" : "broken"
      }'>${await playerLink(
        [player.player.linkID, player.player.name, player.player.team],
        "left"
      )}</div>`;
    }
  }
  html += `<STYLE>.broken{text-decoration:underline} .player{display:inline-block;width:20rem}</STYLE>`;
  return { html, date: new Date() };
}
