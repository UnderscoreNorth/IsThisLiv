import { Request } from "express";
import { db } from "../../../db";
import { Cup, Match, Player, Team } from "../../../db/schema";
import { and, eq, gte, InferSelectModel, like, not } from "drizzle-orm";
import { cupLink, keySort, teamLink } from "../../../lib/helper";

export async function eliteDroughts(req: Request) {
  const cups = await db
    .select()
    .from(Cup)
    .where(eq(Cup.cupType, 1))
    .orderBy(Cup.start);
  let current: Record<
    string,
    { start: InferSelectModel<typeof Cup>; num: number }
  > = {};
  let streaks: Array<{
    team: string;
    start: InferSelectModel<typeof Cup>;
    finish: InferSelectModel<typeof Cup> | string;
    num: number;
  }> = [];
  const teams = (await db.select().from(Team)).map((x) => x.team);
  const deadTeams: Array<string> = [];
  const cupThreshold = cups[cups.length - 2].cupID;
  for (const team of teams) {
    if (
      !(
        await db
          .select()
          .from(Player)
          .where(and(eq(Player.team, team), gte(Player.cupID, cupThreshold)))
      ).length
    )
      deadTeams.push(team);
  }
  let html = `<h2>Elite Droughts</h2>Every streak (4+) of Elite Cup misses in appearances or knockouts. 2021 Worlds is ignored and ongoing streaks will not be shown if the team is dead.<br><br>`;
  html += `<div class='cat'><table><tr><th colspan=4>Groupstage Appearances</th></tr><tr><th>#</th><th>Board</th><th>Last Cup</th><th>Until</th></tr>`;
  for (const cup of cups) {
    await getStreaks(cup, false);
  }
  await displayStreaks();
  html += `</table></div><div class='cat'><table><tr><th colspan=4>Knockout Appearances</th></tr><tr><th>#</th><th>Board</th><th>Last Cup</th><th>Until</th></tr>`;
  current = {};
  streaks = [];
  for (const cup of cups) {
    await getStreaks(cup, true);
  }
  await displayStreaks();
  html += `</table></div><STYLE>td{text-align:left} .cat{display:inline-block;vertical-align:top;margin:0 2rem;}</STYLE>`;
  return { html, date: new Date() };

  async function displayStreaks() {
    for (const team of teams) {
      if (
        current[team] !== undefined &&
        current[team].num > 4 &&
        !deadTeams.includes(team)
      ) {
        streaks.push({
          team,
          start: current[team].start,
          finish: "Ongoing",
          num: current[team].num,
        });
      }
    }
    streaks = keySort(streaks, "num", true);
    for (const streak of streaks) {
      html += `<tr>
            <td>${streak.num}</td>
            <td>${teamLink(streak.team, "left")}</td>
            <td>${await cupLink(streak.start, { logo: true })}</td>
            <td>${
              typeof streak.finish == "string"
                ? `<center>${streak.finish}</center>`
                : await cupLink(streak.finish, { logo: true })
            }</td>
            </tr>`;
    }
  }

  async function getStreaks(cup: InferSelectModel<typeof Cup>, kos: boolean) {
    const matches = await db
      .select()
      .from(Match)
      .where(
        and(
          eq(Match.official, 1),
          eq(Match.cupID, cup.cupID),
          not(eq(Match.cupID, 72)),
          kos ? not(like(Match.round, "%Group%")) : undefined
        )
      );
    const cupTeams: Set<string> = new Set();
    for (const match of matches) {
      cupTeams.add(match.homeTeam);
      cupTeams.add(match.awayTeam);
    }
    for (const team of teams) {
      if (Array.from(cupTeams).includes(team)) {
        if (current[team] !== undefined && current[team].num > 4) {
          streaks.push({
            team,
            start: current[team].start,
            finish: cup,
            num: current[team].num,
          });
        }
        current[team] = { start: cup, num: 0 };
      } else {
        if (current[team] !== undefined) {
          current[team].num++;
        }
      }
    }
  }
}
