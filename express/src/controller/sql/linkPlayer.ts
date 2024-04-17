import { Request } from "express";
import { db } from "../../db";
import { Player, PlayerLink } from "../../db/schema";
import { and, eq } from "drizzle-orm";

export async function linkPlayer(req: Request) {
  const { player } = req.body;
  if (!player.linkID) {
    await db
      .insert(PlayerLink)
      .values({ team: player.team, name: player.name });
    const where = and(
      eq(PlayerLink.team, player.team),
      eq(PlayerLink.name, player.name)
    );
    player.linkID = (await db.query.PlayerLink.findFirst({ where })).linkID;
  }
  await db
    .update(Player)
    .set({ linkID: player.linkID })
    .where(eq(Player.playerID, player.playerID));
  return {};
}
