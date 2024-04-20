import { Request } from "express";
import { db } from "../../db";
import { Cup } from "../../db/schema";
import { desc } from "drizzle-orm";

export async function newCup(req: Request) {
  const { name, season, year, type, start, finish, version, user } = req.body;
  if (name && season && year && type && start && finish && version) {
    await db
      .insert(Cup)
      .values({
        cupName: name,
        season,
        year,
        cupType: type,
        start,
        end: finish,
        pes: version,
        user,
        rankPoints: 0,
      })
      .catch(() => {
        return {
          cupURL: 1,
        };
      });
    return {
      cupURL: (await db.query.Cup.findFirst({ orderBy: desc(Cup.cupID) }))
        .cupID,
    };
  }
  return {};
}
