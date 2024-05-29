import express from "express";
import { saveMiddleWare } from "../../lib/helper";
import { cupRecords, mainRecords, teamRecords } from "./records";
import { leaderboards } from "./leaderboards";

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
router.use("/*", async (req, res, next) => {
  saveMiddleWare(req, res, mainRecords);
});
export default router;
