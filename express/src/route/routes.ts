import express from "express";
import { NextFunction, Request, Response } from "express";
import * as h from "../lib/helper";
import fs from "fs/promises";
import cups from "../controller/cups";
import teams from "../controller/teams";
import players from "../controller/players";
import sql from "../controller/sql";
import managers from "../controller/managers";
import records from "../controller/records";
import ff from "../controller/ff";

/*import cupModels from "../../controller/cupModels.js";
import teamModels from "../../controller/teamModels.js";
import sqlModels from "../../controller/sqlModels.js";
import repeatGroups from "../../controller/misc/repeatGroups.js";
import mostDangerousLead from "../../controller/misc/mostDangerousLead.js";
import subbedPlayers from "../../controller/misc/subbedPlayers.js";
import benchWarmers from "../../controller/misc/benchWarmers.js";
import benchedMedals from "../../controller/misc/benchedMedals.js";
import blessedPlayer from "../../controller/misc/blessedPlayer.js";
import cursedPlayer from "../../controller/misc/cursedPlayer.js";
import playerModels from "../../controller/playerModels.js";
import listModels from "../../controller/listModels.js";
import loginModels from "../../controller/loginModels.js";
import ffController from "../../controller/ff/ffController.js";
import managerModels from "../../controller/managerModels.js";
import rematches from "../../controller/misc/rematches.js";
import lastEliteKnockout from "../../controller/misc/lastElite.js";
import roundTour from "../../controller/misc/roundTour.js";
import eliteStreaks from "../../controller/misc/eliteStreaks.js";
import subbingGK from "../../controller/misc/subbingGK.js";
import subonMOTM from "../../controller/misc/subonMOTM.js";
import editFile from "../../controller/tools/editFile.js";
import groupStage from "../../controller/tools/groupStage.js";
import records from "../../controller/records/records.js";
import shitmedals from "../../controller/misc/shitmedals.js";
import shot_conversion from "../../controller/misc/shot_conversion.js";*/

const router = express.Router();
router.use("/sql", sql);
router.use("/ff", ff);
router.use("/*", loadCache);
router.use("/cups", cups);
router.use("/teams", teams);
router.use("/players", players);
router.use("/managers", managers);
router.use("/records/", records);
/*router.use("/cups/edit", cupModels.edit);
router.use("/cups/:cupID", cupModels.cup);
router.use("/cups", cupModels.main);
router.use("/list/cups", listModels.cups);
router.use("/list/teams", listModels.teams);
router.use("/ff", ffController);
router.use("/managers", managerModels);

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


router.post("/tools/groupStage", multer().none(), groupStage.save);*/

async function loadCache(req: Request, res: Response, next: NextFunction) {
  let stats = await fs.stat(res.locals.staticUrl).catch((err) => {
    return { mtime: new Date("01/01/2000") };
  });
  if (stats.mtime.getTime()) {
    next();
  } else {
    res.send(await fs.readFile(res.locals.staticUrl));
  }
}

export { router as default };
