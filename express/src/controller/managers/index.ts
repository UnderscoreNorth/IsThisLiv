import express from "express";
import { db } from "../../db";
import { Manager, Team } from "../../db/schema";
import { dateFormat } from "../../lib/helper";
import { getMatches } from "../../db/commonFn";

const router = express.Router();
router.use("/", async (req, res, next) => {
  const colours = [];
  const sort: "days" | "start" | "end" | "board" | "eff" | "points" =
    req.body.sort;
  let teamQ = await db.select().from(Team);
  for (let team of teamQ) {
    let prim = team.primaryHex;
    if (prim.length < 6)
      prim =
        prim.substring(0, 1) +
        prim.substring(0, 1) +
        prim.substring(1, 2) +
        prim.substring(1, 2) +
        prim.substring(2, 3) +
        prim.substring(2, 3);
    colours[team.team] = hexToHsl(prim);
  }
  const managerData = await db.select().from(Manager).orderBy(Manager.start);
  let max = 0;
  let arr = [];
  type Run = {
    board: string;
    start: string;
    end: string;
    days: number;
    colour: string;
  };
  let mObj: Record<
    string,
    {
      manager: string;
      active: boolean;
      runs: Array<Run>;
      sortValue: number | string;
      tot: number;
      stats?: {
        w: number;
        d: number;
        l: number;
        t: number;
        e: number;
        p: number;
      };
    }
  > = {};
  for (const m of managerData) {
    let key = m.name;
    if (sort == "board") key += m.team;
    if (mObj[key] == undefined) {
      mObj[key] = {
        manager: m.name,
        active: false,
        runs: [],
        sortValue: 0,
        tot: 0,
      };
      if (sort == "eff" || sort == "points") {
        mObj[key].stats = {
          w: 0,
          d: 0,
          l: 0,
          t: 0,
          e: 0,
          p: 0,
        };
      }
    }
    if (sort == "eff" || sort == "points") {
      const matches = await getMatches({
        team: m.team,
        start: m.start,
        end: m.end ?? new Date(),
      });
      for (const { match } of matches) {
        if (match.winningTeam == m.team) {
          mObj[key].stats.w++;
        } else if (match.winningTeam == "draw") {
          mObj[key].stats.d++;
        } else {
          mObj[key].stats.l++;
        }
      }
      mObj[key].stats.t =
        mObj[key].stats.w + mObj[key].stats.d + mObj[key].stats.l;
      if (mObj[key].stats.t == 0) {
        mObj[key].stats.e = 0;
        mObj[key].stats.p = 0;
      } else {
        mObj[key].stats.p =
          Math.round(
            ((mObj[key].stats.w * 3 + mObj[key].stats.d) / mObj[key].stats.t) *
              100
          ) / 100;
        mObj[key].stats.e = Math.round(
          (mObj[key].stats.w / mObj[key].stats.t) * 100
        );
      }
    }
    let days = Math.floor(
      ((m?.end?.getTime() ?? new Date().getTime()) - m.start.getTime()) /
        86400000
    );
    mObj[key].runs.push({
      board: m.team,
      start: dateFormat(m.start, "number"),
      end: m.end ? dateFormat(m.end, "number") : "Active",
      days,
      colour: colours[m.team],
    });
    mObj[key].tot += days;
    mObj[key].active = m.end ? false : true;
    if (mObj[key].runs.length > max) max = mObj[key].runs.length;
    if (sort == "days") mObj[key].sortValue = -mObj[key].tot;
    if (sort == "start") {
      if (mObj[key].sortValue == 0) mObj[key].sortValue = m.start.getTime();
    }
    if (sort == "end") {
      mObj[key].sortValue = (m.end?.getTime() ?? new Date().getTime()) * -1;
    }
    if (sort == "board") mObj[key].sortValue = m.team;
    if (sort == "eff") mObj[key].sortValue = -mObj[key].stats.e;
    if (sort == "points") mObj[key].sortValue = -mObj[key].stats.p;
  }
  let mArr = Object.values(mObj).sort((a, b) => {
    if (a.sortValue > b.sortValue) return 1;
    if (a.sortValue == b.sortValue) return 0;
    return -1;
  });
  res.send({ max, rowData: mArr });
});
export default router;

function hexToHsl(hex: string) {
  hex = "#" + hex;
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);
  (r /= 255), (g /= 255), (b /= 255);
  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;
  if (max == min) {
    h = s = 0; // achromatic
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  if (l == 0) l = 0.1;
  while (l < 0.6) {
    l = Math.pow(l, 0.5);
  }
  return "hsl(" + h * 360 + "," + s * 100 + "%," + l * 100 + "%)";
}
