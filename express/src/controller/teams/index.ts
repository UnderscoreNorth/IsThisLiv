import express from "express";
import { saveMiddleWare } from "../../lib/helper";
import { teamDetails } from "./teamDetails";
import { overall } from "./overall";

const router = express.Router();

router.use("/overall", (req, res, next) => {
  saveMiddleWare(req, res, overall);
});

router.use("/:teamID", (req, res, next) => {
  saveMiddleWare(req, res, teamDetails);
});
export default router;
