import express from "express";
import { saveMiddleWare } from "../../lib/helper";
import { mainRecords } from "./records";

const router = express.Router();
router.use("/*", async (req, res, next) => {
  res.send(await mainRecords(req));
});
export default router;
