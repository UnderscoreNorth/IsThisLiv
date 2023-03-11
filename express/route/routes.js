import express from "express";
import * as h from "../lib/helper.js";
import fs from "fs/promises";

import cupModels from "../model/cupModels.js";
import teamModels from "../model/teamModels.js";
import sqlModels from "../model/sqlModels.js";
import repeatGroups from "../model/misc/repeatGroups.js";
import mostDangerousLead from "../model/misc/mostDangerousLead.js";
import subbedPlayers from "../model/misc/subbedPlayers.js";
import benchWarmers from "../model/misc/benchWarmers.js";
import benchedMedals from "../model/misc/benchedMedals.js";
import blessedPlayer from "../model/misc/blessedPlayer.js";
import cursedPlayer from "../model/misc/cursedPlayer.js";
import playerModels from "../model/playerModels.js";
import listModels from "../model/listModels.js";
import loginModels from "../model/loginModels.js";
import ffController from "../model/ff/ffController.js";
import managerModels from "../model/managerModels.js";
import rematches from "../model/misc/rematches.js";
import lastEliteKnockout from "../model/misc/lastElite.js";
import roundTour from "../model/misc/roundTour.js";
import eliteStreaks from "../model/misc/eliteStreaks.js";
import subbingGK from "../model/misc/subbingGK.js";
import subonMOTM from "../model/misc/subonMOTM.js";

const router = express.Router();
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
