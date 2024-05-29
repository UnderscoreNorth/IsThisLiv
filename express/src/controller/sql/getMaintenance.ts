import { Request } from "express";
import { db } from "../../db";
import { Cup, Player, Team } from "../../db/schema";
import { and, desc, eq, gte, lt, lte, sum } from "drizzle-orm";
import { cupLink } from "../../lib/helper";

export async function getMaintenance(req: Request) {
  let html = "";
  const missingStartings = await db
    .select({ cupID: Cup.cupID, team: Player.team })
    .from(Cup)
    .innerJoin(Player, eq(Player.cupID, Cup.cupID))
    .where(and(lte(Cup.cupType, 3), gte(Cup.year, 2013)))
    .groupBy(Cup.cupID, Player.team)
    .having(lt(sum(Player.starting), 11))
    .orderBy(desc(Cup.end));
  if (missingStartings.length) {
    html += `<h3>Missing Starting Lineup</h3>
    <table>
        <tr><th>Team</th><th>Cup</th></tr>
        ${(
          await Promise.all(
            missingStartings.map(async (x) => {
              return `<tr><td>${x.team}</td><td>${await cupLink(
                x.cupID
              )}</td></tr>`;
            })
          )
        ).join("")}
    </table>`;
  }
  return { html };
}
