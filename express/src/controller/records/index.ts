import express from "express";
import { saveMiddleWare } from "../../lib/helper";
import { cupRecords, mainRecords } from "./records";

const router = express.Router();
router.use("/cups/:cupID", async (req, res, next) => {
  saveMiddleWare(req, res, cupRecords);
});
router.use("/*", async (req, res, next) => {
  saveMiddleWare(req, res, mainRecords);
});
export default router;
