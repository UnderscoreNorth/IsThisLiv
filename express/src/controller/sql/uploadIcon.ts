import { Request, Response } from "express";
import fs, { existsSync } from "fs";
export async function uploadIcon(req: Request, res: Response) {
  //@ts-ignore
  let file = req.files.file[0];
  let target = `../svelte/static/icons/${req.body.type}/${req.body.name}`;
  if (existsSync(target)) fs.unlinkSync(target);
  fs.renameSync(file.path, target);
  //fs.unlink(file.path, () => {});
  res.send("done");
}
