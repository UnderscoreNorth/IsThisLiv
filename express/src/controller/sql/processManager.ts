import { Request } from "express";
import { db } from "../../db";
import { Manager } from "../../db/schema";
import { and, eq } from "drizzle-orm";

export async function processManager(req: Request) {
  let { board, start, end, manager, action } = req.body;
  if (!end) end = null;
  console.log(start);
  if (action == "add") {
    await db.insert(Manager).values({ team: board, start, end, name: manager });
  } else if (action == "update") {
    await db
      .update(Manager)
      .set({ end })
      .where(
        and(
          eq(Manager.team, board),
          eq(Manager.start, start),
          eq(Manager.name, manager)
        )
      );
  } else if (action == "delete") {
    await db
      .delete(Manager)
      .where(
        and(
          eq(Manager.team, board),
          eq(Manager.start, start),
          eq(Manager.name, manager)
        )
      );
  }
  return {};
}
