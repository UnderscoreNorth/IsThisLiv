import express from "express";
import multer from "multer";
import * as h from "../lib/helper.js";
import fs from "fs/promises";

import cupModels from "../controller/cupModels.js";
import teamModels from "../controller/teamModels.js";
import sqlModels from "../controller/sqlModels.js";
import repeatGroups from "../controller/misc/repeatGroups.js";
import mostDangerousLead from "../controller/misc/mostDangerousLead.js";
import subbedPlayers from "../controller/misc/subbedPlayers.js";
import benchWarmers from "../controller/misc/benchWarmers.js";
import benchedMedals from "../controller/misc/benchedMedals.js";
import blessedPlayer from "../controller/misc/blessedPlayer.js";
import cursedPlayer from "../controller/misc/cursedPlayer.js";
import playerModels from "../controller/playerModels.js";
import listModels from "../controller/listModels.js";
import loginModels from "../controller/loginModels.js";
import ffController from "../controller/ff/ffController.js";
import managerModels from "../controller/managerModels.js";
import rematches from "../controller/misc/rematches.js";
import lastEliteKnockout from "../controller/misc/lastElite.js";
import roundTour from "../controller/misc/roundTour.js";
import eliteStreaks from "../controller/misc/eliteStreaks.js";
import subbingGK from "../controller/misc/subbingGK.js";
import subonMOTM from "../controller/misc/subonMOTM.js";
import editFile from "../controller/tools/editFile.js";
import groupStage from "../controller/tools/groupStage.js";
import records from "../controller/records/records.js";
import shitmedals from "../controller/misc/shitmedals.js";
import shot_conversion from "../controller/misc/shot_conversion.js";

const router = express.Router();
router.use("/cups/edit", cupModels.edit);
router.use("/cups/:cupID", cupModels.cup);
router.use("/cups", cupModels.main);
router.use("/login", loginModels.login);
router.use("/list/cups", listModels.cups);
router.use("/list/teams", listModels.teams);
router.use("/ff", ffController);
router.use("/managers", managerModels);
router.use("/sql/matchDisplay/:matchID", sqlModels.matchDisplay);
router.use("/playersearch", playerModels.search);
router.use("/players/:playerID", loadCache);
router.use("/players/:playerID", playerModels.main);
router.use("/teams/:teamID", loadCache);
router.use("/teams/:teamID", teamModels.team);
router.use("/teams", teamModels.main);
router.use("/misc/", loadCache);
router.use("/misc/repeat_groups", repeatGroups.main);
router.use("/misc/most_dangerous_lead", mostDangerousLead.main);
router.use("/misc/subbed_players", subbedPlayers.main);
router.use("/misc/bench_warmers", benchWarmers.main);
router.use("/misc/bench_medal", benchedMedals.main);
router.use("/misc/blessed_players", blessedPlayer.main);
router.use("/misc/cursed_players", cursedPlayer.main);
router.use("/misc/rematches", rematches.main);
router.use("/misc/last_elite_knockout", lastEliteKnockout.main);
router.use("/misc/round_tour", roundTour.main);
router.use("/misc/elite_streaks", eliteStreaks.main);
router.use("/misc/subbing_the_keeper", subbingGK.main);
router.use("/misc/sub_on_motm", subonMOTM.main);
router.use("/misc/shit_medals", shitmedals.main);
router.use("/misc/shot_conversion", shot_conversion);
router.use("/records/", records.main);
router.post(
  "/tools/processSave",
  multer({ dest: "uploads/" }).fields([{ name: "file" }, { name: "cups" }]),
  editFile.process
);
router.post("/tools/groupStage", multer().none(), groupStage.save);

async function loadCache(req, res, next) {
  let stats = await fs.stat(req.staticUrl).catch((err) => {
    return { mtime: new Date("01/01/2000") };
  });
  if (new Date() - stats.mtime > h.pageExpiry) {
    next();
  } else {
    res.send(JSON.parse(await fs.readFile(req.staticUrl)));
  }
}

export { router as default };
