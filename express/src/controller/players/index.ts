import express from "express";
import { saveMiddleWare } from "../../lib/helper";
import { playerDetails } from "./playerDetails";
import { search } from "./search";
import { getUnlinked } from "./getUnlinked";

const router = express.Router();
router.use("/search/", async (req, res, next) => {
  res.send(await search(req));
});
router.use("/getUnlinked/", async (req, res, next) => {
  res.send(await getUnlinked(req));
});
router.use("/:linkID", (req, res, next) => {
  saveMiddleWare(req, res, playerDetails);
});
export default router;
