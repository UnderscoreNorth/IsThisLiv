import { Request } from "express";
import dayjs from "dayjs";
import { db } from "../../db";
import { Cup, Match } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import { getMatches } from "../../db/commonFn";
import { deleteFile } from "../../lib/helper";
export async function groupStage(req: Request) {
  const { cupID, groups, type } = req.body;
  let matches: Array<{ letter: string; home: string; away: string }> = [];
  const cup = (await db.select().from(Cup).where(eq(Cup.cupID, cupID)))[0];
  if (!cup?.cupID) return { error: "Bad Cup ID" };
  if ((await getMatches({ cupID })).length)
    return { error: "Cup has matches already" };
  let orders = [];
  if (type == "32 Team Rotated Schedule") {
    orders = ["ABCDEFGH", "BCDAFGHE", "CDABGHEF"];
  } else if (type == "32 Team Traditional") {
    orders = ["ABCDEFGH", "ABCDEFGH", "ABCDEFGH"];
  }
  for (const round in orders) {
    let order = orders[round].split("");
    for (let letter of order) {
      for (let i = 0; i <= 3; i++) {
        if (!(groups[letter + i]?.length > 0))
          return { error: "All groups must be filled" };
      }
    }
  }
  for (const round in orders) {
    let order = orders[round].split("");
    for (let letter of order) {
      if (parseInt(round) == 0) {
        matches.push({
          letter,
          home: groups[letter + "0"],
          away: groups[letter + "2"],
        });
        matches.push({
          letter,
          home: groups[letter + "1"],
          away: groups[letter + "3"],
        });
      } else if (parseInt(round) == 1) {
        matches.push({
          letter,
          home: groups[letter + "0"],
          away: groups[letter + "1"],
        });
        matches.push({
          letter,
          home: groups[letter + "2"],
          away: groups[letter + "3"],
        });
      } else {
        matches.push({
          letter,
          home: groups[letter + "1"],
          away: groups[letter + "2"],
        });
        matches.push({
          letter,
          home: groups[letter + "3"],
          away: groups[letter + "0"],
        });
      }
    }
  }
  let dayCounter = 0;
  let currentDate = dayjs(cup.start);
  for (let { letter, home, away } of matches) {
    let matchtime = currentDate.add(dayCounter * 40 + 1020, "minute");
    await db.insert(Match).values({
      cupID,
      round: "Group " + letter,
      homeTeam: home,
      awayTeam: away,
      utcTime: matchtime.toDate(),
      winningTeam: "",
      endPeriod: 0,
      attendance: 0,
      stadium: "",
      valid: 1,
      official: 1,
      user: "",
    });
    dayCounter++;
    if (dayCounter > 7) {
      dayCounter = 0;
      currentDate = currentDate.add(1, "day");
      if (currentDate.day() == 0) {
        currentDate = currentDate.add(4, "day");
      }
    }
  }
  await deleteFile(cupID, "cups");
  return {};
}
