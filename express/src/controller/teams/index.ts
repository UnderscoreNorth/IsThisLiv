import express from "express";
import { saveMiddleWare } from "../../lib/helper";
import { teamDetails } from "./teamDetails";

const router = express.Router();
router.use("/:teamID", (req, res, next) => {
  saveMiddleWare(req, res, teamDetails);
});

export default router;
