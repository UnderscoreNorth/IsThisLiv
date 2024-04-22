import { Request } from "express";
import { db } from "../../db";
import { and, desc, eq, like } from "drizzle-orm";
import { Fantasy, FantasyPlayer, Match } from "../../db/schema";

export async function saveTeam(req: Request) {
  try {
    const { starting, bench, cap, vice, cupID, teamID } = req.body as {
      name: string;
      starting: number[];
      bench: number[];
      cupID: number;
      teamID: number;
      cap: number;
      vice: number;
    };
    const firstGroup = await db.query.Match.findFirst({
      orderBy: Match.utcTime,
      where: and(eq(Match.cupID, cupID), like(Match.round, "%Group%")),
    });
    const lastGroup = await db.query.Match.findFirst({
      orderBy: desc(Match.utcTime),
      where: and(eq(Match.cupID, cupID), like(Match.round, "%Group%")),
    });
    const firstKO = await db.query.Match.findFirst({
      orderBy: Match.utcTime,
      where: and(eq(Match.cupID, cupID), like(Match.round, "Round of %")),
    });
    const existing = await db.query.Fantasy.findFirst({
      where: eq(Fantasy.teamID, teamID),
    });
    if (!(existing?.name?.length > 0)) return { error: "Team not found" };
    let currentDate = new Date().getTime();
    let stage = 0;
    if (
      currentDate > firstGroup.utcTime.getTime() &&
      currentDate < lastGroup.utcTime.getTime()
    )
      return { error: "Too late to save changes" };
    if (firstKO?.utcTime && currentDate > firstKO.utcTime.getTime())
      return { error: "Too late to save changes" };
    if (currentDate > lastGroup.utcTime.getTime()) stage = 1;
    let iX = [bench, starting];
    await db
      .delete(FantasyPlayer)
      .where(
        and(eq(FantasyPlayer.teamID, teamID), eq(FantasyPlayer.stage, stage))
      );
    for (let i of [0, 1]) {
      for (const playerID of iX[i]) {
        await db.insert(FantasyPlayer).values({
          teamID,
          playerID,
          start: i,
          cap: cap == playerID ? 2 : vice == playerID ? 1 : 0,
          r1: 0,
          r2: 0,
          r3: 0,
          r4: 0,
          ro16: 0,
          qf: 0,
          sf: 0,
          fn: 0,
          tot: 0,
          stage,
        });
      }
    }
    return {};
  } catch (err) {
    console.log(err);
    return { error: "Something wrong happened" };
  }
}
