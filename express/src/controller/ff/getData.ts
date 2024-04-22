import { Request } from "express";
import { db } from "../../db";
import { Player, RosterOrder } from "../../db/schema";
import { eq } from "drizzle-orm";

export async function getData(req: Request) {
  try {
    const playersArr = await db
      .select()
      .from(Player)
      .where(eq(Player.cupID, req.body.cupID))
      .orderBy(Player.team, Player.name);
    let players = {};
    for (const player of playersArr) {
      players[player.playerID] = player;
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
