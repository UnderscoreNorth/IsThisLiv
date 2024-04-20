import { Request } from "express";
import { db } from "../../db";
import { Match } from "../../db/schema";
import { deleteFile } from "../../lib/helper";

export async function matchAdd(req: Request) {
  const { cupID, homeTeam, awayTeam, utcTime, round, official, valid } =
    req.body;
  if (!(cupID && homeTeam && awayTeam && utcTime && round)) return {};
  await db.insert(Match).values({
    cupID,
    round,
    homeTeam,
    awayTeam,
    utcTime: new Date(utcTime),
    user: "",
    winningTeam: "",
    endPeriod: 0,
    attendance: 0,
    stadium: "",
    valid,
    official,
  });
  await deleteFile(cupID, "Cup");
  return {};
}
