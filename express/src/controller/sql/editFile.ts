import { Request, Response } from "express";
import fs from "fs";
import { getCupTeams, getPlayers } from "../../db/commonFn";
import { db } from "../../db";
import { Player } from "../../db/schema";
export async function uploadEditFile(req: Request, res: Response) {
  //@ts-ignore
  let file = req.files.file[0];
  let content = fs.readFileSync(file.path, "utf8");
  fs.unlink(file.path, () => {});
  let players: Record<
    string,
    Array<{
      team: string;
      shirtNumber: number;
      name: string;
      regPos: string;
      medal: string;
      captain: boolean;
    }>
  > = {};
  let team = "";
  let cupID = req.body.cup;
  let save = req.body.save;
  const teams = await getCupTeams(cupID);
  if ((await getPlayers({ cupID })).length) {
    res.send({ "Cup has players already": [] });
    return;
  }
  for (let row of content.split(/\r?\n/)) {
    const cols = row.split(/\t/);
    if (row.trim() == "") continue;
    if (cols.length == 1) {
      let parsed = cols[0].replace(/\//g, "");
      if (teams.includes(parsed)) {
        team = parsed;
      } else {
        team = "";
      }
    } else if (cols.length > 1) {
      if (team) {
        if (players[team] == undefined) players[team] = [];
        let name = cols[1].replace(/(.[\dabcdef]{9})/gi, "").trim();
        if (name.toUpperCase() == name) {
          name = name
            .split(" ")
            .map((x) => {
              return x[0] + x.substring(1).toLowerCase();
            })
            .join(" ");
        }
        players[team].push({
          team,
          shirtNumber: parseInt(cols[0]),
          name: name,
          regPos: cols[2],
          medal:
            parseInt(cols[3]) == 99
              ? "Gold"
              : parseInt(cols[3]) == 88
              ? "Silver"
              : "",
          captain: cols[4] ? true : false,
        });
      }
    }
  }
  if (save == "save") {
    try {
      for (const team in players) {
        for (const { name, shirtNumber, regPos, medal, captain } of players[
          team
        ]) {
          let search = (await getPlayers({ team, like: name })).filter(
            (x) => x?.playerlink?.linkID
          );
          let linkID: number;
          if (search.length) linkID = search[0].playerlink.linkID;
          await db.insert(Player).values({
            cupID,
            user: "",
            linkID,
            name,
            team,
            shirtNumber,
            regPos,
            medal,
            captain,
            starting: false,
          });
        }
      }
      res.send({ Saved: [] });
    } catch (err) {
      console.log(err);
      res.send({ Error: [] });
    }
  } else {
    res.send(players);
  }
}
