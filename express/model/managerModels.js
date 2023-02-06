import DB from "../lib/db.js";
import * as h from "../lib/helper.js";
const hexToHsl = (hex) => {
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
};
const main = async (req, res, next) => {
  const colours = [];
  const sort = req.body.sort;
  let teamQ = await DB.query(`SELECT * FROM TeamMeta`);
  for (let team of Object.values(teamQ)) {
    let prim = team.sPrimary;
    if (prim.length < 6)
      prim =
        prim.substring(0, 1) +
        prim.substring(0, 1) +
        prim.substring(1, 2) +
        prim.substring(1, 2) +
        prim.substring(2, 3) +
        prim.substring(2, 3);
    colours[team.sTeam] = hexToHsl(prim);
  }
  let rowQ;
  if (sort == "start") {
    rowQ = await DB.query(
      "SELECT sName FROM `ManagerDB` GROUP BY sName ORDER BY MIN(dStart) ASC"
    );
  } else if (sort == "end") {
    rowQ = await DB.query(
      "SELECT sName FROM `ManagerDB` GROUP BY sName ORDER BY MAX(CASE WHEN dEnd = '0000-00-00' THEN CURDATE() ELSE dEnd END) DESC"
    );
  } else if (sort == "board") {
    rowQ = await DB.query(
      "SELECT sName,sTeam,dStart FROM `ManagerDB` ORDER BY sTeam,dStart ASC"
    );
  } else {
    rowQ = await DB.query(
      "SELECT SUM(DATEDIFF(CASE WHEN dEnd = '0000-00-00' THEN CURDATE() ELSE dEnd END,dStart)), sName FROM `ManagerDB` GROUP BY sName ORDER BY SUM(DATEDIFF(CASE WHEN dEnd = '0000-00-00' THEN CURDATE() ELSE dEnd END,dStart)) DESC"
    );
  }
  let max = 0;
  let arr = [];
  for (let row of Object.values(rowQ)) {
    let rowObj = { manager: row.sName, active: false, runs: [] };
    let rowQ2;
    if (sort == "board") {
      rowQ2 = await DB.query(
        "SELECT * FROM ManagerDB WHERE sName=? AND sTeam=? AND dStart=? ORDER BY dStart",
        [row.sName, row.sTeam, row.dStart]
      );
    } else {
      rowQ2 = await DB.query(
        "SELECT * FROM ManagerDB WHERE sName=? ORDER BY dStart",
        [row.sName]
      );
    }
    let tot = 0;
    let temp = 0;
    let current = false;
    let w = 0;
    let d = 0;
    let l = 0;
    let e = 0;
    let pts = 0;
    let end;
    let days;
    for (let row2 of Object.values(rowQ2)) {
      if (row2.dEnd == "Invalid Date") {
        row2.dEnd = "Active";
        current = true;
        end = new Date() + 86400000;
        days = (new Date() - new Date(row2.dStart)) / 86400000;
      } else {
        end = new Date(row2.dEnd);
        row2.dEnd =
          end.getFullYear() +
          "-" +
          (end.getMonth() + 1).toString().padStart(2, 0) +
          "-" +
          end.getDate().toString().padStart(2, 0);
        days = (new Date(row2.dEnd) - new Date(row2.dStart)) / 86400000;
      }
      if (sort == "eff" || sort == "points") {
        let rowQ3 = await DB.query(
          `SELECT sWinningTeam FROM MatchDB WHERE bVoided = 1 AND (sHomeTeam=? OR sAwayTeam=?) AND dUTCTime >= ? AND dUTCTime <=?`,
          [row2.sTeam, row2.sTeam, row2.dStart, end]
        );
        for (let row3 of Object.values(rowQ3)) {
          if (row3.sWinningTeam == row2.sTeam) {
            w++;
          } else if (row3.sWinningTeam == "draw") {
            d++;
          } else {
            l++;
          }
        }
      }
      let startDate = new Date(row2.dStart);
      let startDateFormatted =
        startDate.getFullYear() +
        "-" +
        (startDate.getMonth() + 1).toString().padStart(2, 0) +
        "-" +
        startDate.getDate().toString().padStart(2, 0);
      rowObj.runs.push({
        board: row2.sTeam,
        start: startDateFormatted,
        end: row2.dEnd,
        days: Math.round(days),
        colour: colours[row2.sTeam],
      });
      temp++;
      tot += days;
    }
    if (temp > max) max = temp;
    if (current) rowObj.active = true;
    if (w + d + l > 0) {
      e = w / (w + d + l);
      pts = Math.round(((w * 3 + d) / (w + d + l)) * 100) / 100;
    }
    rowObj.w = w;
    rowObj.d = d;
    rowObj.l = l;
    rowObj.e = Math.round(e * 100) / 100;
    rowObj.pts = pts;
    rowObj.tot = Math.round(tot);
    arr.push(rowObj);
  }
  if (sort == "eff") {
    arr.sort((a, b) => {
      if (a.e > b.e) return -1;
      if (a.e < b.e) return 1;
      return 0;
    });
  }
  if (sort == "points") {
    arr.sort((a, b) => {
      if (a.pts > b.pts) return -1;
      if (a.pts < b.pts) return 1;
      return 0;
    });
  }
  res.send({ max, rowData: arr });
};

export default main;
