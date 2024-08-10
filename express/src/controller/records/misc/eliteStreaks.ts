import { Request } from "express";
import { db } from "../../../db";
import { getCupTeams } from "../../../db/commonFn";
import { Cup, Team } from "../../../db/schema";
import { lte } from "drizzle-orm";
import { cupLink, teamLink } from "../../../lib/helper";

type Streaks = Array<{
  team: string;
  start: string;
  end: string;
  num: number;
  date: Date;
}>;
type Streak = { start: string; end: string; num: number; date: Date };

export async function eliteStreaks(req: Request) {
  const cups = await db
    .select()
    .from(Cup)
    .where(lte(Cup.cupType, 2))
    .orderBy(Cup.start);
  const teams = (await db.select().from(Team)).map((x) => x.team);

  const withStreaks: Streaks = [];
  const withoutStreaks: Streaks = [];
  for (const team of teams) {
    let withStreak = {
      start: "",
      end: "",
      num: 0,
      date: new Date(),
    };
    let withoutStreak = {
      start: "",
      end: "",
      num: 0,
      date: new Date(),
    };
    for (const cup of cups) {
      if ((await getCupTeams(cup.cupID)).includes(team)) {
        if (cup.cupType == 1) {
          if (!withStreak.start)
            withStreak.start = await cupLink(cup, { logo: true });
          if (!withoutStreak.start)
            withoutStreak.start = await cupLink(cup, { logo: true });
          withStreak.end = await cupLink(cup, { logo: true });
          withStreak.num++;
          withoutStreak.num++;
          withoutStreak.end = await cupLink(cup, { logo: true });
          withStreak.date = cup.end;
          withoutStreak.date = cup.end;
        } else {
          finishStreak(withStreak, withStreaks, team);
        }
      } else {
        if (cup.cupType == 1) {
          finishStreak(withStreak, withStreaks, team);
          finishStreak(withoutStreak, withoutStreaks, team);
        }
      }
    }
    finishStreak(withStreak, withStreaks, team, true);
    finishStreak(withoutStreak, withoutStreaks, team, true);
  }
  withStreaks.sort((a, b) => {
    if (a.num > b.num) return -1;
    if (a.num < b.num) return 1;
    if (a.date.getTime() > b.date.getTime()) return -1;
    if (a.date.getTime() < b.date.getTime()) return 1;
    return 0;
  });
  withoutStreaks.sort((a, b) => {
    if (a.num > b.num) return -1;
    if (a.num < b.num) return 1;
    if (a.date.getTime() > b.date.getTime()) return -1;
    if (a.date.getTime() < b.date.getTime()) return 1;
    return 0;
  });
  return {
    date: new Date(),
    html: `<h2>Consecutive Elite Cup Appearances</h2>
    Every streak (4+) of Elite Cup Appearances
    <table><tr><th>Without Babbies In Between</th><th>With Babbies In Between</th></tr><tr><td style='vertical-align:top'>
    <table><tr><th>#</th><th>Board</th><th>Start</th><th>End</th>
    ${arrayToTable(withStreaks)}</table></td><td style='vertical-align:top'>
    <table><tr><th>#</th><th>Board</th><th>Start</th><th>End</th>
    ${arrayToTable(withoutStreaks)}</td></tr></table>
    <style>
      .cupIcon{
      height:25px;
      vertical-align:middle;
      margin-right:5px;
      }
    </style>`,
  };
}
function arrayToTable(streaks: Streaks) {
  return streaks
    .map((x) => {
      return `<tr><td>${x.num}</td><td>${teamLink(
        x.team,
        "right"
      )}</td><td style='text-align:left'>${
        x.start
      }</td><td style='text-align:left'>${x.end}</td></tr>`;
    })
    .join("");
}
function finishStreak(
  streak: Streak,
  streaks: Streaks,
  team: string,
  end = false
) {
  if (end == true) streak.end = "<center><b>Ongoing</b></center>";
  if (streak.num >= 4) {
    streaks.push({ ...streak, ...{ team } });
  }
  streak.start = "";
  streak.end = "";
  streak.num = 0;
}
