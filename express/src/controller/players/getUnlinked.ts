import { Request } from "express";
import { getPlayers } from "../../db/commonFn";
import { DeepSet } from "../../lib/helper";

export async function getUnlinked(req: Request) {
  const players = await getPlayers({});
  const unlinkedPlayers = players
    .filter((x) => !x?.player?.linkID)
    .sort((a, b) => {
      if (a.cup.cupID > b.cup.cupID) return -1;
      else if (a.cup.cupID < b.cup.cupID) return 1;
      return 0;
    });
  const teamLinks = {};
  for (const team of Array.from(
    new Set(unlinkedPlayers.map((x) => x.player.team))
  )) {
    teamLinks[team] = Array.from(
      new DeepSet(
        players
          .filter((x) => x.player.team == team && x?.playerLink?.linkID)
          .map((x) => x.playerLink)
          .sort((a, b) => {
            if (a.name > b.name) return 1;
            return -1;
          })
      )
    );
  }
  return {
    unlinkedPlayers,
    teamLinks,
  };
}
