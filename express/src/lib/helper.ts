import { NextFunction, Request, Response } from "express";
import { db } from "../db";
import fs from "fs/promises";
import { InferSelectModel } from "drizzle-orm";
import { Cup } from "../db/schema";
export const pageExpiry = 8640000000; //;

export function teamIcon(team: string) {
  if (team.length == 0) return "";
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
export async function cupLink(
  cupID: number | InferSelectModel<typeof Cup>,
  params: {
    logo?: boolean;
    format?: "long" | "med" | "short";
    text?: string;
    textPos?: "after" | "above";
  } = {
    logo: false,
    format: "long",
    text: "",
    textPos: "after",
  }
) {
  const { logo, format } = params;
  if (params.textPos == undefined) params.textPos = "after";
  let text = params.text?.length ? " " + params.text : "";
  let cup =
    typeof cupID == "number"
      ? await db.query.Cup.findFirst({
          where: (Cup, { eq }) => eq(Cup.cupID, cupID),
        })
      : cupID;
  cupID = cup.cupID;
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
  let cupText = cup.cupName;
  if (format == "short") cupText = cupShort(cup.cupName);
  if (format == "med") {
    cupText = cup.year + " " + cup.season;
    if (cup.cupType == 3) cupText += " Q";
    if (cup.cupType == 4) cupText += " F";
  }
  if (params.textPos == "above") cupText += "<br>";
  cupText += text;
  let logoHtml = `<img style='${
    format == "med"
      ? ""
      : "height:2.5rem;vertical-align:middle;margin-right:5px"
  }' src='/icons/cups/${cupID}.png' />
  `;
  let textHtml = `<span style='vertical-align:middle'>${cupText}</span>`;
  if (logo) {
    return `<a style='display:inline-block' href='/cups/${cupID}-${cupShortName}'>${
      params.textPos == "after"
        ? logoHtml + textHtml
        : textHtml + "<br>" + logoHtml
    }
    </a>`;
  }

  return `<a href='/cups/${cupID}-${cupShortName}'>${cupText}</a>`;
}
export function cupShort(cupName: string) {
  let cupWords = cupName.split(" ");
  let shortName = "";
  for (let cupWord of cupWords) {
    if (parseInt(cupWord) && parseInt(cupWord) > 2000) {
      shortName += cupWord + " ";
    } else if (cupWord != "4chan") {
      if (cupWord == "World") {
        shortName += "S";
      } else {
        shortName += cupWord[0];
      }
    }
  }
  return shortName;
}

export async function playerLink(
  player: number | [number, string, string],
  icon?: "left" | "right" | "none",
  link = true
) {
  let id = 0;
  let name = "";
  let team = "";
  if (player == null) return "Unlinked Player";
  if (typeof player == "number") {
    id = player;
    await db.query.PlayerLink.findFirst({
      where: (p, { eq }) => eq(p.linkID, id),
    })
      .then((r) => {
        name = r.name;
        team = r.team;
      })
      .catch(() => {
        name = "Unlinked Player";
      });
  } else {
    id = player[0];
    name = player[1];
    team = player[2];
  }
  let urlname = name.replace(/./gm, function (s) {
    return s.match(/[a-z0-9\s]+/i) ? s : "";
  });
  if (!link) return name;
  return (
    (icon == "left" ? teamIcon(team) : "") +
    `<a href='/players/${id}-${urlname}'>${name}</a>` +
    (icon == "right" ? teamIcon(team) : "")
  );
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
      dateString.getUTCDate().toString().padStart(2, "0")
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

export function pos(pos: string) {
  let color1: string;
  let color2: string;
  switch (pos) {
    case "SS":
    case "CF":
    case "LWF":
    case "RWF":
      color1 = "#D95F5F";
      color2 = "#C10000";
      break;
    case "DMF":
    case "CMF":
    case "AMF":
    case "LMF":
    case "RMF":
      color1 = "#94D965";
      color2 = "#51B80C";
      break;
    case "LB":
    case "RB":
    case "CB":
    case "SB":
      color1 = "#6C9ED4";
      color2 = "#1861B0";
      break;
    case "GK":
      color1 = "#E7D260";
      color2 = "#CCAD02";
      break;
  }
  return `
<div style="display:flex;width:45px;background-image: -moz-linear-gradient(top, #585858, #0E0E0E); background-image: -ms-linear-gradient(top, #585858, #0E0E0E); background-image: -o-linear-gradient(top, #585858, #0E0E0E); background-image: -webkit-linear-gradient(top, #585858, #0E0E0E); background-image: linear-gradient(top, #585858, #0E0E0E);border-top: 1px solid #7a7d82; border-bottom: 1px solid #7a7d82; border-radius: 4px;" >
    <div style="width:4px;background-image: -moz-linear-gradient(top, ${color1}, ${color2}); background-image: -ms-linear-gradient(top, ${color1}, ${color2}); background-image: -o-linear-gradient(top, ${color1}, ${color2}); background-image: -webkit-linear-gradient(top, ${color1}, ${color2}); background-image: linear-gradient(top, ${color1}, ${color2});; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">&nbsp;
</div>
<div style="color:#FFF;text-align:center;flex-grow:1">${pos}
</div>
</div>`;
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
export function keySort<T>(
  object: T & Array<any>,
  key: string,
  descending = false
): T {
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
export function keySortMulti<T>(
  object: T & Array<any>,
  keys: Array<{ key: keyof T[any]; descending?: boolean }>
): T {
  object.sort((a, b) => {
    for (const key of keys) {
      let r = 0;
      if (a[key.key] > b[key.key]) {
        r = 1;
      } else if (a[key.key] < b[key.key]) {
        r = -1;
      }
      if (key.descending) r *= -1;
      if (r !== 0) return r;
    }
    return 0;
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
export const secondYellowType = [8];
export const straightRedType = [6];
export const redCardTypes = [...secondYellowType, ...straightRedType];
export const missedPenType = [9];
export const savedPenType = [10];

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

export async function deleteFile(id: number, type: "cups" | "players") {
  let files = await fs.readdir("cache/");
  for (const file of files) {
    if (parseInt(file.split(`__api__${type}__`)?.[1]?.split("-")?.[0]) == id)
      await fs.unlink("cache/" + file);
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
