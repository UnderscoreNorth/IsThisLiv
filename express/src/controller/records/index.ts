import express from "express";
import { saveMiddleWare } from "../../lib/helper";
import { cupRecords, mainRecords, teamRecords } from "./records";
import { leaderboards } from "./leaderboards";
import { repeatGroups } from "./misc/repeatGroups";
import { mostDangerousLead } from "./misc/mostDangerousLead";

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
router.use("/*", async (req, res, next) => {
  saveMiddleWare(req, res, mainRecords);
});
export default router;
