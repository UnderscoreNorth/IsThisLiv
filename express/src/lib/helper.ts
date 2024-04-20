import { NextFunction, Request, Response } from "express";
import { db } from "../db";
import fs from "fs/promises";
export const pageExpiry = 86400000; //;

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
export function teamIcon(team: string) {
  return `<img class='teamIcon' src='/icons/team-small/38px-${
    team[0].toUpperCase() + team.substring(1).toLowerCase()
  }_icon.png' alt='${team}' />`;
}

export function teamLink(team: string, icon?: "left" | "right") {
  if (team != "draw") {
    if (team) {
      return `<a href='/teams/${team}'>${
        icon == "left" ? teamIcon(team) : ""
      }/${team}/${icon == "right" ? teamIcon(team) : ""}</a>`;
    } else {
      return "TBD";
    }
  } else {
    return team;
  }
}
export async function cupLink(cupID, logo = false) {
  let cup = await db.query.Cup.findFirst({
    where: (Cup, { eq }) => eq(Cup.cupID, cupID),
  });
  if (cup == undefined) return;
  let cupShortName =
    cup.year +
    "-" +
    cup.season[0] +
    (cup.cupType == 1
      ? ""
      : cup.cupType == 2
      ? "B"
      : cup.cupType == 3
      ? "Q"
      : "F") +
    "C";
  if (logo)
    return `<a style='display:inline-block' href='/cups/${cupID}-${cupShortName}'>${
      logo
        ? `<img style='height:2.5rem;vertical-align:middle;margin-right:5px' src='/icons/cups/${cupID}.png' />`
        : ""
    }<span style='vertical-align:middle'>${cup.cupName}</span></a>`;
  return `<a href='/cups/${cupID}-${cupShortName}'>${cup.cupName}</a>`;
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

export async function playerLink(player: number | [number, string]) {
  let id = 0;
  let name = "";
  if (player == null) return "Unlinked Player";
  if (typeof player == "number") {
    id = player;
    name = await db.query.PlayerLink.findFirst({
      where: (p, { eq }) => eq(p.linkID, id),
    })
      .then((r) => {
        return r.name;
      })
      .catch(() => {
        return "Unlinked Player";
      });
  } else {
    id = player[0];
    name = player[1];
  }
  let urlname = name.replace(/./gm, function (s) {
    return s.match(/[a-z0-9\s]+/i) ? s : "";
  });
  return `<a href='/players/${id}-${urlname}'>${name}</a>`;
}

export function dateFormat(
  dateString: Date | string,
  type: "med" | "short" | "number" = "med"
) {
  let options: any = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  if (type == "short")
    options = {
      month: "short",
      day: "numeric",
    };

  if (typeof dateString == "string") dateString = new Date(dateString);
  if (type == "number")
    return (
      dateString.getFullYear() +
      "-" +
      (dateString.getMonth() + 1).toString().padStart(2, "0") +
      "-" +
      dateString.getDate().toString().padStart(2, "0")
    );
  return dateString.toLocaleString("en-US", options);
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
    .sort((a, b) => parseFloat(b) - parseFloat(a))
    .reduce((obj, key) => {
      obj[key] = object[key];
      return obj;
    }, {});
}

export function asort(object: Object) {
  return Object.entries(object)
    .sort(([, a], [, b]) => parseFloat(a) - parseFloat(b))
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

export function arsort(object: Object, index = 0) {
  return Object.entries(object).sort(([, a], [, b]) => {
    return b[index] - a[index];
  });
}

export const goalTypes = [1, 4];
export const goalTypesOG = [3];
export const assistTypes = [2];
export const yellowCardTypes = [5];
export const redCardTypes = [6, 8];

export async function saveMiddleWare(
  req: Request,
  res: Response,
  fn: Function
) {
  let result = await fn(req);
  await fs.writeFile(res.locals.staticUrl, JSON.stringify(result));
  res.send(result);
}

export function avg(arr: number[], round = true) {
  if (!arr.length) return 0;
  let avg = arr.reduce((a, c) => a + c, 0) / arr.length;
  if (round) {
    avg = Math.round(avg * 100) / 100;
  }
  return avg;
}

export function sum(arr: number[]) {
  return arr.reduce((a, c) => a + c, 0);
}
export class DeepSet extends Set {
  add(o: any) {
    for (const i of this) if (this.deepCompare(o, i)) return this;
    super.add.call(this, o);
    return this;
  }

  private deepCompare(o: any, i: any) {
    return JSON.stringify(o) === JSON.stringify(i);
  }
}

export async function deleteFile(id: number, type: "Cup") {
  let files = await fs.readdir("cache/");

  if (type == "Cup") {
    for (const file of files) {
      if (parseInt(file.split("__api__cups__")?.[1]?.split("-")?.[0]) == id)
        await fs.unlink("cache/" + file);
    }
  }
}

export function formatEventTime({
  regTime,
  injTime,
}: {
  regTime: number;
  injTime: number;
}) {
  return regTime + (injTime >= 0 ? `+${injTime}'` : `'`);
}
