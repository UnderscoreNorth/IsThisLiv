import { Request } from "express";
import { db } from "../../db";
import { PlayerLink } from "../../db/schema";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import { deleteFile } from "../../lib/helper";

export async function updateLinkName(req: Request) {
  const { linkID, name } = req.body;
  if (!(parseInt(linkID) > 0)) return {};
  await db
    .update(PlayerLink)
    .set({ name })
    .where(eq(PlayerLink.linkID, linkID));
  await deleteFile(linkID, "players");
  return {};
}
