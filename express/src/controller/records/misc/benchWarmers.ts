import { Request } from "express";
import { db } from "../../../db";
import { Cup, Performance, Player } from "../../../db/schema";
import { and, desc, eq, gte, inArray, lte, not } from "drizzle-orm";
import {
  cupLink,
  cupShort,
  keySort,
  playerLink,
  teamLink,
} from "../../../lib/helper";
import { getMatches, getPerformances, getPlayers } from "../../../db/commonFn";

export async function benchWarmers(req: Request) {
  let html = `<h2>Bench Warmers</h2>
        Players that never got to spend time on the pitch (2012 SC Onwards)
        <br>Underline indicates that this was also the player's first cup on the left table, and that they're on the current roster on the right table.<br><br>`;
  let currentCup = "";
  html += `<div class='subContainer' style='width:8rem;'>
            <h3 style='margin:0;padding:1px;'>Jump To</h3>`;
  let e = "";
  let link: Array<{ html: string; cups: number[]; team: string }> = [];
  let sql = await db
    .select()
    .from(Player)
    .innerJoin(Cup, eq(Cup.cupID, Player.cupID))
    .where(
      and(
        not(
          inArray(
            Player.playerID,
            db.select({ playerID: Performance.playerID }).from(Performance)
          )
        ),
        lte(Cup.cupType, 3),
        gte(Player.linkID, 0),
        gte(Cup.cupID, 4)
      )
    )
    .orderBy(desc(Cup.start), Player.team, Player.name);
  for (const { cup, player } of sql) {
    let playerHTML = "";
    if (cup.cupName != currentCup) {
      html += `<a href='#${cupShort(cup.cupName)}'>${cupShort(
        cup.cupName
      )}</a><br>`;
      e += `<tr id='${cupShort(cup.cupName)}' >
                    <th colspan=3>${cup.cupName}</th>
                </tr>`;
    }
    currentCup = cup.cupName;
    let boldCheck = await db
      .select()
      .from(Cup)
      .innerJoin(Player, eq(Cup.cupID, Player.cupID))
      .where(eq(Player.linkID, player.linkID))
      .orderBy(Cup.start);
    if (boldCheck[0].cup.cupName == cup.cupName) {
      playerHTML = "<td style='text-decoration:underline'>";
    } else {
      playerHTML = "<td>";
    }
    playerHTML += `${await playerLink([
      player.linkID,
      player.name,
      player.team,
    ])}</td>`;
    e += `<tr><td>${teamLink(player.team, "left")}</td><td>${
      player.regPos
    }</td>${playerHTML}</tr>`;

    if (typeof link[player.linkID] == "undefined") {
      let [b, b2] = (
        await db
          .select()
          .from(Player)
          .where(
            and(
              eq(Player.team, player.team),
              eq(
                Player.cupID,
                db
                  .select({ cupID: Player.cupID })
                  .from(Player)
                  .where(eq(Player.team, player.team))
                  .orderBy(desc(Player.cupID))
                  .limit(1)
              ),
              eq(Player.linkID, player.linkID)
            )
          )
      ).length
        ? ["<u>", "</u>"]
        : ["", ""];
      link[player.linkID] = {
        html: `<td>${teamLink(
          player.team,
          "left"
        )}</td><td>${b}${await playerLink([
          player.linkID,
          player.name,
          player.team,
        ])}${b2}</td>`,
        cups: boldCheck.map((x) => x.cup.cupID),
        team: player.team,
      };
    }
  }
  html += "</div><div class='subContainer'><table>";
  html += e;
  html +=
    "</table></div><div class='subContainer'><table><tr><th>Matches</th><th>Played</th><th>Bench %</th><th>Team</th><th>Player</th></tr>";
  let bench = [];
  for (let pID in link) {
    let pInf = link[pID];
    let mID = [];
    let c = 0;
    for (const id of pInf.cups) {
      let sql = await getMatches({
        getVoided: true,
        getUnofficial: true,
        team: pInf.team,
        cupID: id,
      });
      c += sql.length;
      mID.push(...sql.map((x) => x.match.matchID));
    }
    let p = (
      await db
        .select()
        .from(Performance)
        .innerJoin(Player, eq(Performance.playerID, Player.playerID))
        .where(
          and(
            eq(Player.linkID, parseInt(pID)),
            inArray(Performance.matchID, mID)
          )
        )
    ).length;
    if (p / c < 0.5 && c > 3)
      bench.push({
        num: c,
        per: Math.round(((c - p) / c) * 100),
        html: `<tr><td>${c}</td><td>${p}</td><td>${Math.round(
          ((c - p) / c) * 100
        )}%</td>${pInf.html}</tr>`,
      });
  }
  bench.sort((a, b) => {
    if (a.per > b.per) return -1;
    if (a.per < b.per) return 1;
    if (a.num > b.num) return -1;
    if (a.num < b.num) return 1;
    return 0;
  });
  for (let player of bench) {
    html += player.html;
  }
  html += `</table></div>
        <STYLE>
            td{
                text-align:left;
            }
            .subContainer{
                display: inline-block;
                vertical-align: top;
                height: 70vh;
                overflow-y: scroll;
                background: rgba(0,0,0,0.1);
                margin: 1rem;
                padding: 1rem;
                border:solid 1px grey;
                margin-bottom:0;
            }
            table{
                border:none!important;
                background:none!important;
            }
        </STYLE>`;
  return { html, date: new Date() };
}
