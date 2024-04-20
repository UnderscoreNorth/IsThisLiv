import express from "express";
import { saveMiddleWare } from "../../lib/helper";
import { mainRecords } from "./records";

const router = express.Router();
router.use("/cups/*", async (req, res, next) => {
  res.send({});
});
router.use("/*", async (req, res, next) => {
  saveMiddleWare(req, res, mainRecords);
});
export default router;
