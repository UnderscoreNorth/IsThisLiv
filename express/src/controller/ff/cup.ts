import { Request } from "express";
import { db } from "../../db";
import { Fantasy, FantasyPlayer, Player, RosterOrder } from "../../db/schema";
import { eq } from "drizzle-orm";
import { playerLink } from "../../lib/helper";

export async function getCup(req: Request) {
  const cupID = parseInt(req.params.cupID);
  console.log(cupID);
  if (!(cupID > 0)) return {};
  const teams = await db.select().from(Fantasy).where(eq(Fantasy.cupID, cupID));
  let data: {
    team: string;
    group: any;
    ko: any;
    points: {
      r1: number;
      r2: number;
      r3: number;
      r4: number;
      ro16: number;
      qf: number;
      sf: number;
      fn: number;
      tot: number;
    };
  }[] = [];
  for (const team of teams) {
    const players = await db
      .select()
      .from(FantasyPlayer)
      .innerJoin(Player, eq(FantasyPlayer.playerID, Player.playerID))
      .innerJoin(RosterOrder, eq(Player.regPos, RosterOrder.pos))
      .where(eq(FantasyPlayer.teamID, team.teamID))
      .orderBy(RosterOrder.order);
    const teamData = {
      team: team.name,
      group: { start: [], bench: [] },
      ko: { start: [], bench: [] },
      points: {
        r1: 0,
        r2: 0,
        r3: 0,
        r4: 0,
        ro16: 0,
        qf: 0,
        sf: 0,
        fn: 0,
        tot: 0,
      },
    };
    for (const { player, fantasyp } of players) {
      const round = fantasyp.stage === 1 ? "ko" : "group";
      const start = fantasyp.start === 1 ? "start" : "bench";
      teamData[round][start].push({
        team: player.team,
        pos: player.regPos,
        player: await playerLink([player.linkID, player.name, player.team]),
        points: fantasyp,
        cap: fantasyp.cap,
        medal: player.medal,
      });
      for (let key in teamData.points) {
        teamData.points[key] += fantasyp[key];
      }
    }
    data.push(teamData);
  }
  data.sort((a, b) => {
    if (a.points.tot > b.points.tot) return -1;
    if (a.points.tot < b.points.tot) return 1;
    return 0;
  });
  return data;
}
