import { Request } from "express";
import { getPlayers } from "../../db/commonFn";

export async function cupTeamDisplay(req: Request) {
  const { team, cupID } = req.body;
  return (await getPlayers({ cupID, team })).sort((a, b) => {
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
  });
}
