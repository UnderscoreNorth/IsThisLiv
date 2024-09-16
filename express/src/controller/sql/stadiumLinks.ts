import { Request } from "express";
import { db } from "../../db";
import { Match, Stadiums } from "../../db/schema";
import { and, eq } from "drizzle-orm";

export async function getStadiumLinks() {
  const stadiums = (
    await db
      .select({ stadium: Match.stadium })
      .from(Match)
      .groupBy(Match.stadium)
      .orderBy(Match.stadium)
  ).map((x) => x.stadium);
  const stadiumLinks = await db
    .select()
    .from(Stadiums)
    .orderBy(Stadiums.stadium, Stadiums.alias);
  return { stadiums, stadiumLinks };
}
export async function linkStadium(req: Request) {
  const { stadium, alias } = req.body;
  if (stadium && alias) await db.insert(Stadiums).values({ stadium, alias });
}
export async function unlinkStadium(req: Request) {
  const { stadium, alias } = req.body;
  if (stadium && alias)
    await db
      .delete(Stadiums)
      .where(and(eq(Stadiums.stadium, stadium), eq(Stadiums.alias, alias)));
}
