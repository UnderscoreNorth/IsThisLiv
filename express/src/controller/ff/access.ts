import { Request } from "express";
import { checkPassword, createPassword, encrypt } from "../sql/user/login";
import { db } from "../../db";
import { and, desc, eq, inArray, like, not, SQL } from "drizzle-orm";
import {
  Cup,
  Fantasy,
  FantasyPlayer,
  Match,
  Player,
  RosterOrder,
} from "../../db/schema";

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
    const required = [];
    const groupsFormation = { DEF: 0, MID: 0, FWD: 0 };

    const koMatches = await db
      .select()
      .from(Match)
      .where(and(eq(Match.cupID, cup.cupID), eq(Match.round, "Round of 16")));
    let koTeams: string[] = [];
    if (koMatches.length) {
      for (const match of koMatches) {
        koTeams.push(match.homeTeam);
        koTeams.push(match.awayTeam);
      }
    }
    let players = await db
      .select({ player: FantasyPlayer })
      .from(FantasyPlayer)
      .innerJoin(Player, eq(FantasyPlayer.playerID, Player.playerID))
      .where(
        and(
          eq(FantasyPlayer.teamID, existing.teamID),
          eq(FantasyPlayer.stage, stage)
        )
      );
    if (stage == 1) {
      let groups = await db
        .select({ player: FantasyPlayer, RosterOrder, p: Player })
        .from(FantasyPlayer)
        .innerJoin(Player, eq(FantasyPlayer.playerID, Player.playerID))
        .innerJoin(RosterOrder, eq(Player.regPos, RosterOrder.pos))
        .where(
          and(
            eq(FantasyPlayer.teamID, existing.teamID),
            eq(FantasyPlayer.stage, 0)
          )
        );
      for (const player of groups.filter((x) => x.player.start == 1)) {
        switch (player.RosterOrder.type) {
          case 1:
            groupsFormation.DEF++;
            break;
          case 2:
          case 3:
            groupsFormation.MID++;
            break;
          case 4:
            groupsFormation.FWD++;
            break;
        }
      }
      for (const player of groups.filter((x) => koTeams.includes(x.p.team))) {
        required.push(player.player.playerID);
      }
      if (players.length == 0)
        players = groups.filter((x) => koTeams.includes(x.p.team));
    }
    let cap = 0;
    let vice = 0;
    for (const { player } of players) {
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
        required,
        groupsFormation,
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
