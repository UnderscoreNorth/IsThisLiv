import { Request } from "express";
import { getPlayers } from "../../db/commonFn";

export async function search(req: Request) {
  let like = "%" + req.body.search + "%";
  const players = await getPlayers({ like });
  const result: Record<
    string,
    { id: number; team: string; urlName: string; name: string }
  > = {};
  for (const { playerLink } of players) {
    if (!playerLink?.linkID) continue;
    result[playerLink.linkID] = {
      id: playerLink.linkID,
      team: playerLink.team,
      urlName: playerLink.name.replace(/./gm, function (s) {
        return s.match(/[a-z0-9]+/i) ? s : "";
      }),
      name: playerLink.name,
    };
  }
  return Object.values(result);
}
