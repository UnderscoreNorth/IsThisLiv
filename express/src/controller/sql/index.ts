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
import { newCup } from "./newCup";
import { processManager } from "./processManager";
import { updateCupTeam } from "./updateCupTeam";
import { updateLinkName } from "./updateLinkName";
import { groupStage } from "./groupStage";
import { getMaintenance } from "./getMaintenance";
import { calcAllCups, calcAllTeams } from "../records/records";
import { rebuildCurrentCup } from "./rebuildCurrentCup";
import { matchHistory } from "./matchHistory";
import { getStadiumLinks, linkStadium, unlinkStadium } from "./stadiumLinks";
import { uploadIcon } from "./uploadIcon";

const router = express.Router();
router.use("/user", user);
router.post(
  "/uploadSaveFile",
  multer({ dest: "uploads/" }).fields([{ name: "file" }, { name: "cups" }]),
  uploadEditFile
);
router.post(
  "/uploadIcon",
  multer({ dest: "uploads/" }).fields([
    { name: "file" },
    { name: "type" },
    { name: "name" },
  ]),
  uploadIcon
);
router.use("/matchDisplay/:matchID", async (req, res, next) => {
  res.send(await matchDisplay(req));
});
router.use("/matchHistory/:matchID", async (req, res, next) => {
  res.send(await matchHistory(req));
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
router.use("/newCup", async (req, res, next) => {
  res.send(await newCup(req));
});
router.use("/processManager", async (req, res, next) => {
  res.send(await processManager(req));
});
router.use("/updateCupTeam", async (req, res, next) => {
  res.send(await updateCupTeam(req));
});
router.use("/updateLinkName", async (req, res, next) => {
  res.send(await updateLinkName(req));
});
router.use("/groupstage", async (req, res, next) => {
  res.send(await groupStage(req));
});
router.use("/getmaintenance", async (req, res, next) => {
  res.send(await getMaintenance(req));
});

router.use("/rebuildCupRecords", async (req, res, next) => {
  res.send(await calcAllCups());
});

router.use("/rebuildTeamRecords", async (req, res, next) => {
  res.send(await calcAllTeams());
});
router.use("/rebuildCurrentCup", async (req, res, next) => {
  res.send(await rebuildCurrentCup());
});
router.use("/getStadiums", async (req, res, next) => {
  res.send(await getStadiumLinks());
});
router.use("/linkStadium", async (req, res, next) => {
  res.send(await linkStadium(req));
});
router.use("/unlinkStadium", async (req, res, next) => {
  res.send(await unlinkStadium(req));
});
export default router;
