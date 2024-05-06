import { Request } from "express";
import { db } from "../../db";
import { Match, Performance, Player, RosterOrder } from "../../db/schema";
import { and, eq, gt, inArray, SQL, SQLWrapper, sum } from "drizzle-orm";

export async function getData(req: Request) {
  try {
    if (!(parseInt(req.body.cupID) > 0)) return {};
    const koMatches = await db
      .select()
      .from(Match)
      .where(
        and(eq(Match.cupID, req.body.cupID), eq(Match.round, "Round of 16"))
      );
    let where: SQL<unknown>;
    if (koMatches.length) {
      let koTeams: string[] = [];
      for (const match of koMatches) {
        koTeams.push(match.homeTeam);
        koTeams.push(match.awayTeam);
      }
      where = and(
        eq(Player.cupID, req.body.cupID),
        inArray(Player.team, koTeams)
      );
    } else {
      where = eq(Player.cupID, req.body.cupID);
    }
    const playersArr = await db
      .select()
      .from(Player)
      .where(where)
      .orderBy(Player.team, Player.name);
    let players = {};
    const points = await db
      .select({ playerID: Player.playerID, points: sum(Performance.ff) })
      .from(Performance)
      .innerJoin(Player, eq(Player.playerID, Performance.playerID))
      .where(and(where, gt(Performance.rating, -99)))
      .groupBy(Player.playerID);
    for (const player of playersArr) {
      players[player.playerID] = player;
    }
    for (const player of points) {
      players[player.playerID].points = player.points;
    }
    const teams = Array.from(new Set(playersArr.map((x) => x.team)));
    const medals = Array.from(new Set(playersArr.map((x) => x.medal)));
    const rosterOrderArr = (
      await db.select().from(RosterOrder).orderBy(RosterOrder.order)
    ).map((x) => {
      if (x.type == 0) x.type = "GK";
      if (x.type == 1) x.type = "DEF";
      if (x.type == 2 || x.type == 3) x.type = "MID";
      if (x.type == 4) x.type = "FWD";
      return x;
    });
    let posOrder = {};
    for (const pos of rosterOrderArr) {
      posOrder[pos.pos] = pos.type;
    }
    const pos = rosterOrderArr.map((x) => x.pos);
    return { players, teams, pos, medals, posOrder };
  } catch (err) {
    console.log(err);
    return {};
  }
}
