import express from "express";
import { create, getUsers, login, loginToken, resetPassword } from "./login";

const router = express.Router();
router.use("/login", async (req, res, next) => {
  res.send(await login(req));
});
router.use("/logintoken", async (req, res, next) => {
  res.send(await loginToken(req));
});
router.use("/get", async (req, res, next) => {
  res.send(await getUsers());
});
router.use("/resetPassword", async (req, res, next) => {
  res.send(await resetPassword(req));
});
router.use("/create", async (req, res, next) => {
  res.send(await create(req));
});
export default router;
