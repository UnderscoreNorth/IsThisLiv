import DB from "../lib/db.js";
import fs from "fs/promises";
import path from "path";
export const pageExpiry = 1; //86400000;

export async function rebuild(whitelist = []) {
  console.log("rebuild");
  const directory = "../express/build/";
  const files = await fs.readdir(directory);
  for (const file of files) {
    if (!whitelist.includes(file)) {
      await fs.unlink(directory + file);
    }
  }
}

export function teamLink(team) {
  if (team != "draw") {
    if (team) {
      return `<a href='/teams/${team}'>/${team}/</a>`;
    } else {
      return "TBD";
    }
  } else {
    return team;
  }
}
export async function cupLink(cupID) {
  let cup = await DB.query("SELECT * FROM `CupDB` WHERE iID=?", [cupID]);
  cup = cup[0];
  let cupShortName =
    cup.iYear +
    "-" +
    cup.sSeason[0] +
    (cup.iType == 1 ? "" : cup.iType == 2 ? "B" : cup.iType == 3 ? "Q" : "F") +
    "C";
  return `<a href='/cups/${cupID}-${cupShortName}'>${cup.sName}</a>`;
}

export function cupShort(cupName) {
  let cupWords = cupName.split(" ");
  let shortName = "";
  for (let cupWord of cupWords) {
    if (parseInt(cupWord) && cupWord > 2000) {
      shortName += cupWord + " ";
    } else if (cupWord != "4chan") {
      shortName += cupWord[0];
    }
  }
  return shortName;
}

export async function playerLink(player) {
  let id = 0;
  let name = "";
  if (typeof player == "object") {
    id = player[0];
    name = player[1];
  } else {
    id = player;
    let sql = await DB.query("SELECT sPlayer FROM PlayerLinkDB WHERE iID=?", [
      id,
    ]);
    name = sql[0].sPlayer;
  }
  let urlname = name.replace(/./gm, function (s) {
    return s.match(/[a-z0-9\s]+/i) ? s : "";
  });
  return `<a href='/players/${id}-${urlname}'>${name}</a>`;
}

export function dateFormat(dateString, type = "med") {
  let options = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  if (type == "short")
    options = {
      month: "short",
      day: "numeric",
    };
  if (typeof dateString == "object") {
    return dateString.toLocaleString("en-US", options);
  } else {
    let date = Date.parse(dateString);
    return date.toLocaleString("en-US", options);
  }
}

export function ksort(object) {
  return Object.keys(object)
    .sort()
    .reduce((obj, key) => {
      obj[key] = object[key];
      return obj;
    }, {});
}

export function krsort(object) {
  return Object.keys(object)
    .sort((a, b) => b - a)
    .reduce((obj, key) => {
      obj[key] = object[key];
      return obj;
    }, {});
}

export function asort(object) {
  return Object.entries(object)
    .sort(([, a], [, b]) => a - b)
    .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
}
export function keySort(object, key, descending = false) {
  object.sort((a, b) => {
    let r = 0;
    if (a[key] > b[key]) {
      r = 1;
    } else if (a[key] < b[key]) {
      r = -1;
    }
    if (descending) r *= -1;
    return r;
  });
  return object;
}

export function arsort(object, index = 0) {
  return Object.entries(object).sort(([, a], [, b]) => {
    return b[index] - a[index];
  });
}

export const goalTypes = [1, 4];
