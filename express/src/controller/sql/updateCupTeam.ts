import { eq, InferSelectModel } from "drizzle-orm";
import { Request } from "express";
import { Player } from "../../db/schema";
import { db } from "../../db";

export async function updateCupTeam(req: Request) {
  const { players } = req.body as {
    players: InferSelectModel<typeof Player>[];
  };
  if (!players?.length) return {};
  for (const player of players) {
    const playerID = player.playerID;
    delete player.playerID;
    if (player.linkID == "") player.linkID = null;
    await db.update(Player).set(player).where(eq(Player.playerID, playerID));
  }
  return {};
}
