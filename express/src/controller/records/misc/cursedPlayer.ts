import { Request } from "express";
import { db } from "../../../db/index.js";
import { Match, Performance, Player, PlayerLink } from "../../../db/schema.js";
import { and, eq, InferSelectModel } from "drizzle-orm";
import { playerLink, teamLink } from "../../../lib/helper.js";

export async function cursedPlayers(req: Request) {
  let html =
    "<h2>Cursed Players</h2>Players with at least 4 matches that have lost or drew everytime. Underlines indicate active players.<br><br><table><tr><th>Matches</th><th>Draws</th><th>Losses</th><th>Team</th><th>Player</th></tr>";
  const players = await db
    .select()
    .from(Performance)
    .innerJoin(Player, eq(Performance.playerID, Player.playerID))
    .innerJoin(Match, eq(Match.matchID, Performance.matchID))
    .innerJoin(PlayerLink, eq(Player.linkID, PlayerLink.linkID))
    .where(and(eq(Match.valid, 1)));
  const playerObj: Record<
    number,
    {
      link: InferSelectModel<typeof PlayerLink>;
      latestCup: number;
      c: number;
      w: number;
      d: number;
      l: number;
    }
  > = {};

  const latestCups: Record<string, number> = {};
  for (const p of players) {
    const pID = p.playerlink.linkID;
    if (playerObj[pID] == undefined) {
      playerObj[pID] = {
        link: p.playerlink,
        c: 0,
        w: 0,
        d: 0,
        l: 0,
        latestCup: 0,
      };
      if (latestCups[p.player.team] == undefined) latestCups[p.player.team] = 0;
    }
    latestCups[p.player.team] = Math.max(
      latestCups[p.player.team],
      p.player.cupID
    );
    playerObj[pID].latestCup = Math.max(
      playerObj[pID].latestCup,
      p.player.cupID
    );
    playerObj[pID].c++;
    switch (p.match.winningTeam) {
      case "draw":
        playerObj[pID].d++;
        break;
      case p.playerlink.team:
        playerObj[pID].w++;
        break;
      default:
        playerObj[pID].l++;
        break;
    }
  }
  for (const p of Object.values(playerObj)) {
    if (p.c < 4 || p.w > 0) delete playerObj[p.link.linkID];
  }

  const pArr = Object.values(playerObj).sort((a, b) => {
    if (a.c > b.c) return -1;
    if (a.c < b.c) return 1;
    if (a.l > b.l) return -1;
    if (a.l < b.l) return 1;
    return 0;
  });
  for (const p of pArr) {
    html += `<tr><td>${p.c}</td><td>${p.d}</td><td>${
      p.l
    }</td><td style='text-align:left'>${teamLink(
      p.link.team,
      "left"
    )}</td><td style='text-align:left${
      p.latestCup == latestCups[p.link.team] ? ";text-decoration:underline" : ""
    }'>${await playerLink([
      p.link.linkID,
      p.link.name,
      p.link.team,
    ])}</td></tr>`;
  }
  html += "</table>";
  return { html, date: new Date() };
}