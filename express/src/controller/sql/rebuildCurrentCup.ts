import { getCups, getCupTeams } from "../../db/commonFn";
import fs from "fs/promises";
import { port } from "../../../config.json";
import { calcAllTeams } from "../records/records";
import { db } from "../../db";
import { Team } from "../../db/schema";

export async function rebuildCurrentCup() {
  const cup = (await getCups({ excludeFriendlies: false, asc: false }))[0];
  const cache = await fs.readdir("cache/");
  //Cup Pages
  await rebuildMass("__api__records__Cup-");
  await rebuildMass("__api__records__Match-");
  await rebuildMass("__api__records__Misc-");
  await rebuildMass("__api_records__Overall");
  await rebuild(`cache/__api__records__cups__${cup.cupID}`);
  await rebuild("cache/__api__cups.json");
  await rebuild(`cache/__api__cups__${cup.cupID}.json`);
  await rebuildMass("__api__teams__");
  await rebuildMass("__api__players__");
  await calcAllTeams();
  return { data: "complete" };
  async function rebuildMass(str: string) {
    for (const file of cache) {
      if (file.includes(str)) {
        await rebuild("cache/" + file);
      }
    }
  }
}

async function rebuild(str: string) {
  await fetch(`http://localhost:${port}${cacheNameToRoute(str)}`).catch(
    (err) => {
      console.log(err);
    }
  );
}

function cacheNameToRoute(str: string) {
  return str
    .replace("cache/", "")
    .replace(/__/g, "/")
    .replace(/\.json$/, "");
}
