import express from "express";
import { saveMiddleWare } from "../../lib/helper";
import { cupRecords, mainRecords, teamRecords } from "./records";
import { leaderboards } from "./leaderboards";
import { repeatGroups } from "./misc/repeatGroups";
import { mostDangerousLead } from "./misc/mostDangerousLead";
import { ninetyplusgoals } from "./misc/90plusgoals";
import { rematches } from "./misc/rematches";
import { possession } from "./misc/possession";
import { teamMatchup } from "./misc/teamMatchup";
import { yoyo } from "./misc/yoyo";
import { groupStageByTeam } from "./misc/groupStageByTeam";
import { groupStageResults } from "./misc/groupStageResults";
import { togetherForever } from "./misc/togetherforever";
import { roundTour } from "./misc/roundTour";
import { eliteStreaks } from "./misc/eliteStreaks";
import { benchWarmers } from "./misc/benchWarmers";
import { benchedMedals } from "./misc/benchedMedals";
import { blessedPlayers } from "./misc/blessedPlayer";
import { cursedPlayers } from "./misc/cursedPlayer";
import { eliteDroughts } from "./misc/eliteDroughts";
import { shitMedals } from "./misc/shitmedals";
import { shotConversion } from "./misc/shot_conversion";
import { alwaysSubbedOn } from "./misc/alwaysSubbedOn";
import { subOnMOTM } from "./misc/subonMOTM";
import { subbingGKs } from "./misc/subbingGK";
import { playersByCupDebut } from "./misc/playersByCupDebut";
import { milestoneEvents } from "./misc/milestoneEvents";
import { milestoneMatches } from "./misc/milestoneMatches";
import { conditionDifferences } from "./misc/conditionDifferences";
import { closedGroups } from "./misc/closedGroups";
import { stadiums } from "./misc/stadiums";
import { allMedalScoring } from "./misc/allMedalsScoring";
import { facingCupWinner } from "./misc/facingCupWinner";
import { nonMedalMOTM } from "./misc/nonMedalMotM";

const router = express.Router();
router.use("/cups/:cupID", async (req, res, next) => {
  saveMiddleWare(req, res, cupRecords);
});
router.use("/teams/:team", async (req, res, next) => {
  saveMiddleWare(req, res, teamRecords);
});
router.use("/leaderboards/:cupID", async (req, res, next) => {
  saveMiddleWare(req, res, leaderboards);
});
router.use("/misc-repeat%20groups", async (req, res, next) => {
  saveMiddleWare(req, res, repeatGroups);
});
router.use("/misc-most%20dangerous%20lead", async (req, res, next) => {
  saveMiddleWare(req, res, mostDangerousLead);
});
router.use("/Misc-90*", async (req, res, next) => {
  saveMiddleWare(req, res, ninetyplusgoals);
});
router.use("/Misc-rematch*", async (req, res, next) => {
  saveMiddleWare(req, res, rematches);
});
router.use("/Misc-Possession*", async (req, res, next) => {
  saveMiddleWare(req, res, possession);
});
router.use("/Misc-team%20matchup", async (req, res, next) => {
  saveMiddleWare(req, res, teamMatchup);
});
router.use("/Misc-yoyos", async (req, res, next) => {
  saveMiddleWare(req, res, yoyo);
});
router.use("/Misc-Group%20Stage%20Results", async (req, res, next) => {
  saveMiddleWare(req, res, groupStageResults);
});
router.use("/Misc-Together%20Forever", async (req, res, next) => {
  saveMiddleWare(req, res, togetherForever);
});
router.use(
  "/Misc-Group%20Stage%20Results%20by%20Team",
  async (req, res, next) => {
    saveMiddleWare(req, res, groupStageByTeam);
  }
);
router.use("/Misc-Round%20Tour", async (req, res, next) => {
  saveMiddleWare(req, res, roundTour);
});
router.use("/Misc-Elite%20Streaks", async (req, res, next) => {
  saveMiddleWare(req, res, eliteStreaks);
});
router.use("/Misc-Bench%20warmers", async (req, res, next) => {
  saveMiddleWare(req, res, benchWarmers);
});
router.use("/Misc-Benched%20Medals", async (req, res, next) => {
  saveMiddleWare(req, res, benchedMedals);
});
router.use("/Misc-Blessed%20Players", async (req, res, next) => {
  saveMiddleWare(req, res, blessedPlayers);
});
router.use("/Misc-cursed%20players", async (req, res, next) => {
  saveMiddleWare(req, res, cursedPlayers);
});
router.use("/Misc-Elite%20Droughts", async (req, res, next) => {
  saveMiddleWare(req, res, eliteDroughts);
});
router.use("/Misc-Shit%20Medals", async (req, res, next) => {
  saveMiddleWare(req, res, shitMedals);
});
router.use("/Misc-Shot%20Conversion", async (req, res, next) => {
  saveMiddleWare(req, res, shotConversion);
});
router.use("/misc-always%20subbed%20on", async (req, res, next) => {
  saveMiddleWare(req, res, alwaysSubbedOn);
});
router.use("/misc-sub%20on%20motm", async (req, res, next) => {
  saveMiddleWare(req, res, subOnMOTM);
});
router.use("/misc-subbing%20gks", async (req, res, next) => {
  saveMiddleWare(req, res, subbingGKs);
});
router.use("/misc-players%20by%20cup%20debut", async (req, res, next) => {
  saveMiddleWare(req, res, playersByCupDebut);
});
router.use("/misc-milestone%20events", async (req, res, next) => {
  saveMiddleWare(req, res, milestoneEvents);
});
router.use("/misc-milestone%20matches", async (req, res, next) => {
  saveMiddleWare(req, res, milestoneMatches);
});
router.use("/misc-condition%20differences", async (req, res, next) => {
  saveMiddleWare(req, res, conditionDifferences);
});
router.use("/misc-closed%20groups", async (req, res, next) => {
  saveMiddleWare(req, res, closedGroups);
});
router.use("/misc-stadiums", async (req, res, next) => {
  saveMiddleWare(req, res, stadiums);
});
router.use("/misc-all%20medals%20scoring", async (req, res, next) => {
  saveMiddleWare(req, res, allMedalScoring);
});
router.use("/Misc-Facing%20the%20Cup%20Winner", async (req, res, next) => {
  saveMiddleWare(req, res, facingCupWinner);
});

router.use("/Misc-Nonmedal%20Motm", async (req, res, next) => {
  saveMiddleWare(req, res, nonMedalMOTM);
});
router.use("/*", async (req, res, next) => {
  saveMiddleWare(req, res, mainRecords);
});
export default router;
