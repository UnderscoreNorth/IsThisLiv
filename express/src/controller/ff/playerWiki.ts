import { Request } from "express";
import { db } from "../../db";
import {
  Cup,
  Fantasy,
  FantasyPlayer,
  Match,
  Player,
  RosterOrder,
} from "../../db/schema";
import { and, desc, eq, like, or } from "drizzle-orm";
import { playerLink } from "../../lib/helper";
import { getPerformances } from "../../db/commonFn";

export default async function playerWiki(req: Request) {
  const cupID = req.body.cupID;
  if (!(cupID > 0)) return { error: "Bad Cup ID" };
  const cup = (await db.select().from(Cup).where(eq(Cup.cupID, cupID)))[0];
  const performances = await getPerformances({ cupID: cup.cupID });
  const rowsObj: Record<
    number,
    {
      team: string;
      pos: string;
      player: string;
      medal: string;
      R1?: number | "";
      R2?: number | "";
      R3?: number | "";
      R4?: number | "";
      Ro16?: number | "";
      QF?: number | "";
      SF?: number | "";
      "3rd/Finals"?: number | "";
      Total: number;
      "# GS Picks": number;
      "# KS Picks": number;
      playerID: number;
    }
  > = {};
  for (const p of performances) {
    const pID = p.player.playerID;
    if (rowsObj[pID] == undefined)
      rowsObj[pID] = {
        team: p.player.team,
        pos: p.player.regPos,
        player: p.player.name,
        R1: "",
        R2: "",
        R3: "",
        R4: "",
        Ro16: "",
        QF: "",
        SF: "",
        "3rd/Finals": "",
        Total: 0,
        "# GS Picks": 0,
        "# KS Picks": 0,
        medal: p.player.medal,
        playerID: pID,
      };
    let rating: number | "" = p.performance.ff;
    rowsObj[pID].Total += rating;
    if (p.performance.rating < 0) rating = "";
    if (typeof rating == "number") {
      if (p.match.round == "Quarter") {
        rowsObj[pID].QF = rating;
      } else if (p.match.round == "Round of 16") {
        rowsObj[pID].Ro16 = rating;
      } else if (p.match.round == "Semifinal") {
        rowsObj[pID].SF = rating;
      } else if (["3rd Place", "Final"].includes(p.match.round)) {
        rowsObj[pID]["3rd/Finals"] = rating;
      } else if (p.match.round.includes("Group")) {
        let dates = await db
          .select()
          .from(Match)
          .where(
            and(
              or(
                eq(Match.homeTeam, p.player.team),
                eq(Match.awayTeam, p.player.team)
              ),
              eq(Match.cupID, cup.cupID),
              like(Match.round, "%Group%"),
              eq(Match.valid, 1)
            )
          )
          .orderBy(Match.utcTime);
        for (let i = 0; i < dates.length; i++) {
          if (dates[i].matchID == p.match.matchID) {
            rowsObj[pID]["R" + (i + 1)] = rating;
            break;
          }
        }
      }
    }
  }
  for (const player of Object.values(rowsObj)) {
    const picks = await db
      .select()
      .from(FantasyPlayer)
      .where(eq(FantasyPlayer.playerID, player.playerID));
    player["# GS Picks"] = picks.filter((x) => x.stage == 0).length;
    player["# KS Picks"] = picks.filter((x) => x.stage == 1).length;
  }
  let rows = Object.values(rowsObj).sort((a, b) => {
    if (a.team > b.team) return 1;
    if (a.team < b.team) return -1;
    if (a.player > b.player) return 1;
    if (a.player < b.player) return -1;
    return 0;
  });
  return {
    wiki: `{|  class='wikitable sortable' style='font-size: 90%; background: transparent;'
|-
!  style='background-color:#cdcdcd;' |  Team
!  style='background-color:#cdcdcd;' |  Pos
!  style='background-color:#cdcdcd;' |  Player
!  style='background-color:#cdcdcd;width:60px' |  R1
!  style='background-color:#cdcdcd;width:60px' |  R2
!  style='background-color:#cdcdcd;width:60px' |  R3
!  style='background-color:#cdcdcd;width:60px' |  R4
!  style='background-color:#cdcdcd;width:60px' |  Ro16
!  style='background-color:#cdcdcd;width:60px' |  QF
!  style='background-color:#cdcdcd;width:60px' |  SF
!  style='background-color:#cdcdcd;width:60px' |  3rd/Finals
!  style='background-color:#cdcdcd;width:60px' |  Total
!  style='background-color:#cdcdcd;' |  # GS Picks
!  style='background-color:#cdcdcd;' |  # KS Picks${rows
      .map((x) => {
        return `
|- ${
          x.medal == "Gold"
            ? `style='background:#E0C068`
            : x.medal == "Silver"
            ? `style='background:#B7BEC5'`
            : ""
        }
| {{team away|${x.team}}} 
| {{Position|${x.pos.toUpperCase()}}}
| ${x.player} 
| ${x.R1}
| ${x.R2}
| ${x.R3}
| ${x.R4}
| ${x.Ro16}
| ${x.QF}
| ${x.SF}
| ${x["3rd/Finals"]}
| ${x.Total}
| ${x["# GS Picks"]}
| ${x["# KS Picks"]}`;
      })
      .join("")}
|}`,
  };
}
