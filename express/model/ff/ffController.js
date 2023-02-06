import express from "express";
import cup from "./cup.js";
import calculate from "./calculate.js";
import teamList from "./teamList.js";
const router = express.Router();
router.use("/cup", cup);
router.use("/calculate", calculate);
router.use("/teamlist", teamList);
export { router as default };
