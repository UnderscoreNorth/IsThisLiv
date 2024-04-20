import express from "express";
import multer from "multer";
import { matchDisplay } from "./matchDisplay";
import { uploadEditFile } from "./editFile";
import { cupTeamDisplay } from "./cupTeamDisplay";
import { linkPlayer } from "./linkPlayer";
import user from "./user";
import { clearCache } from "./clearCache";
import { matchSave } from "./matchSave";
import { db } from "../../db";
import { Round } from "../../db/schema";
import { matchAdd } from "./matchAdd";

const router = express.Router();
router.use("/user", user);
router.post(
  "/uploadSaveFile",
  multer({ dest: "uploads/" }).fields([{ name: "file" }, { name: "cups" }]),
  uploadEditFile
);
router.use("/matchDisplay/:matchID", async (req, res, next) => {
  res.send(await matchDisplay(req));
});
router.use("/cupTeamDisplay", async (req, res, next) => {
  res.send(await cupTeamDisplay(req));
});
router.use("/playerLink/", async (req, res, next) => {
  res.send(await linkPlayer(req));
});
router.use("/clearCache", async (req, res, next) => {
  res.send(await clearCache());
});
router.use("/matchSave", async (req, res, next) => {
  res.send(await matchSave(req));
});
router.use("/rounds", async (req, res, next) => {
  res.send(await db.select().from(Round).orderBy(Round.round));
});
router.use("/addMatch", async (req, res, next) => {
  res.send(await matchAdd(req));
});
export default router;
