import { Request } from "express";
import { db } from "../../db";
import { desc, eq } from "drizzle-orm";
import { Cup, Fantasy } from "../../db/schema";

export async function teamList(req: Request) {
  let cupID = req.body.cupID;
  if (!(parseInt(cupID) > 0)) {
    cupID = (await db.query.Cup.findFirst({ orderBy: desc(Cup.start) })).cupID;
  }
  return (await db.select().from(Fantasy).where(eq(Fantasy.cupID, cupID))).map(
    (x) => x.name
  );
}
