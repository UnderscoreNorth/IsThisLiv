import express from "express";
import { saveMiddleWare } from "../../lib/helper";
import { teamList } from "./teamList";
import { login, register } from "./access";
import { getData } from "./getData";
import { saveTeam } from "./saveTeam";
import calculate from "./calculate";
import { getCup } from "./cup";
import mainWiki from "./mainWiki";

const router = express.Router();
router.use("/cup/:cupID", async (req, res, next) => {
  res.send(await getCup(req));
});
router.use("/calculate", async (req, res, next) => {
  res.send(await calculate(req));
});
router.use("/teamList", async (req, res, next) => {
  res.send(await teamList(req));
});
router.use("/register", async (req, res, next) => {
  res.send(await register(req));
});
router.use("/login", async (req, res, next) => {
  res.send(await login(req));
});
router.use("/getData", async (req, res, next) => {
  res.send(await getData(req));
});
router.use("/saveTeam", async (req, res, next) => {
  res.send(await saveTeam(req));
});
router.use("/mainWiki", async (req, res, next) => {
  res.send(await mainWiki(req));
});
export default router;
