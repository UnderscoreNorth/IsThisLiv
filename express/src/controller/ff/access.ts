import { Request } from "express";
import { checkPassword, createPassword, encrypt } from "../sql/user/login";
import { db } from "../../db";
import { and, desc, eq, like, not } from "drizzle-orm";
import { Cup, Fantasy, FantasyPlayer, Match } from "../../db/schema";

export async function login(req: Request) {
  let { team, prv } = req.body;
  try {
    team = team.trim();
    if (team.length == 0) return { error: "Please enter a team name" };
    const cup = await db.query.Cup.findFirst({ orderBy: desc(Cup.start) });
    const lastGroup = await db.query.Match.findFirst({
      orderBy: desc(Match.utcTime),
      where: and(eq(Match.cupID, cup.cupID), like(Match.round, "%Group%")),
    });
    const existing = await db.query.Fantasy.findFirst({
      where: and(eq(Fantasy.cupID, cup.cupID), eq(Fantasy.name, team)),
    });
    if (!(existing?.name?.length > 0)) return { error: "Team not found" };
    if (!checkPassword(prv, existing.pub))
      return { error: "Incorrect password" };
    let stage = 0;
    if (
      typeof lastGroup?.utcTime !== "undefined" &&
      new Date().getTime() > lastGroup.utcTime.getTime()
    )
      stage = 1;
    const starting = [];
    const bench = [];
    const players = await db
      .select()
      .from(FantasyPlayer)
      .where(
        and(
          eq(FantasyPlayer.teamID, existing.teamID),
          eq(FantasyPlayer.stage, stage)
        )
      );
    let cap = 0;
    let vice = 0;
    for (const player of players) {
      if (player.start) {
        starting.push(player.playerID);
      } else {
        bench.push(player.playerID);
      }
      if (player.cap == 2) cap = player.playerID;
      if (player.cap == 1) vice = player.playerID;
    }
    return {
      data: {
        starting,
        bench,
        cupID: existing.cupID,
        teamID: existing.teamID,
        name: existing.name,
        cap,
        vice,
      },
    };
  } catch (err) {
    console.log(err);
    return { error: "Something went wrong" };
  }
}
export async function register(req: Request) {
  let { team } = req.body as { team: string };
  try {
    team = team.trim();
    if (team.length == 0) return { error: "Please enter a team name" };
    const cup = await db.query.Cup.findFirst({ orderBy: desc(Cup.start) });
    const firstMatch = await db.query.Match.findFirst({
      orderBy: Match.utcTime,
      where: eq(Match.cupID, cup.cupID),
    });
    const existing = await db.query.Fantasy.findFirst({
      where: and(eq(Fantasy.cupID, cup.cupID), eq(Fantasy.name, team)),
    });
    if (existing?.name?.length > 0) return { error: "Team name already taken" };
    if (new Date().getTime() > firstMatch.utcTime.getTime())
      return { error: "Can not register after the first match" };
    const prv = createPassword();
    const pub = encrypt(prv);
    await db
      .insert(Fantasy)
      .values({ cupID: cup.cupID, name: team, prv: "", pub });
    return {
      prv,
    };
  } catch (err) {
    console.log(err);
    return { error: "Something went wrong" };
  }
}
