import { Request } from "express";
import { getPlayers } from "../../db/commonFn";

export async function search(req: Request) {
  let like = "%" + req.body.search + "%";
  const players = await getPlayers({ like });
  const result: Record<
    string,
    { id: number; team: string; urlName: string; name: string }
  > = {};
  for (const { playerlink } of players) {
    if (!playerlink?.linkID) continue;
    result[playerlink.linkID] = {
      id: playerlink.linkID,
      team: playerlink.team,
      urlName: playerlink.name.replace(/./gm, function (s) {
        return s.match(/[a-z0-9]+/i) ? s : "";
      }),
      name: playerlink.name,
    };
  }
  return Object.values(result);
}
