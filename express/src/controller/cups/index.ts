import express from "express";
import { saveMiddleWare } from "../../lib/helper";
import { cupDetails } from "./cupDetails";
import { cupsOverview } from "./cupsOverview";
import { getCups } from "../../db/commonFn";
const router = express.Router();
router.use("/list", async (req, res, next) => {
  res.send(await getCups());
});
router.use("/:cupID", (req, res, next) => {
  saveMiddleWare(req, res, cupDetails);
});
router.use("/", (req, res, next) => {
  saveMiddleWare(req, res, cupsOverview);
});
export default router;
