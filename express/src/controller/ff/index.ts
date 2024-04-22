import express from "express";
import { saveMiddleWare } from "../../lib/helper";
import { teamList } from "./teamList";
import { login, register } from "./access";
import { getData } from "./getData";
import { saveTeam } from "./saveTeam";
const router = express.Router();
router.use("/cup", async (req, res, next) => {
  //res.send(await getCups());
});
router.use("/calculate", (req, res, next) => {
  //saveMiddleWare(req, res, cupDetails);
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
export default router;
