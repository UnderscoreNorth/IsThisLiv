import { Request } from "express";
import { getPlayers } from "../../db/commonFn";
import { db } from "../../db";
import { PlayerLink } from "../../db/schema";
import { eq } from "drizzle-orm";

export async function cupTeamDisplay(req: Request) {
  const { team, cupID } = req.body;
  return {
    links: await db
      .select()
      .from(PlayerLink)
      .where(eq(PlayerLink.team, team))
      .orderBy(PlayerLink.name),
    players:
      (await getPlayers({ cupID, team }))?.sort((a, b) => {
        if (a.player.starting > b.player.starting) {
          return -1;
        } else if (a.player.starting < b.player.starting) {
          return 1;
        } else {
          if (a.rosterorder.order > b.rosterorder.order) {
            return 1;
          } else if (a.rosterorder.order < b.rosterorder.order) {
            return -1;
          } else {
            return 0;
          }
        }
      }) ?? [],
  };
}
