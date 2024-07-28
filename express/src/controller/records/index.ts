import express from "express";
import { saveMiddleWare } from "../../lib/helper";
import { cupRecords, mainRecords, teamRecords } from "./records";
import { leaderboards } from "./leaderboards";
import { repeatGroups } from "./misc/repeatGroups";
import { mostDangerousLead } from "./misc/mostDangerousLead";
import { ninetyplusgoals } from "./misc/90plusgoals";
import { rematches } from "./misc/rematches";
import { possession } from "./misc/possession";
import { teamMatchup } from "./misc/teamMatchup";

const router = express.Router();
router.use("/cups/:cupID", async (req, res, next) => {
  saveMiddleWare(req, res, cupRecords);
});
router.use("/teams/:team", async (req, res, next) => {
  saveMiddleWare(req, res, teamRecords);
});
router.use("/leaderboards/:cupID", async (req, res, next) => {
  saveMiddleWare(req, res, leaderboards);
});
router.use("/misc-repeat%20groups", async (req, res, next) => {
  saveMiddleWare(req, res, repeatGroups);
});
router.use("/misc-most%20dangerous%20lead", async (req, res, next) => {
  saveMiddleWare(req, res, mostDangerousLead);
});
router.use("/Misc-90*", async (req, res, next) => {
  saveMiddleWare(req, res, ninetyplusgoals);
});
router.use("/Misc-rematch*", async (req, res, next) => {
  saveMiddleWare(req, res, rematches);
});
router.use("/Misc-Possession*", async (req, res, next) => {
  saveMiddleWare(req, res, possession);
});
router.use("/Misc-team%20matchup", async (req, res, next) => {
  saveMiddleWare(req, res, teamMatchup);
});
router.use("/*", async (req, res, next) => {
  saveMiddleWare(req, res, mainRecords);
});
export default router;
