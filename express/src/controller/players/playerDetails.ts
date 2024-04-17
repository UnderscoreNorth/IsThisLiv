import { Request } from "express";
import {
  getCups,
  getEvents,
  getPerformances,
  getPlayers,
} from "../../db/commonFn";
import { cupShort, dateFormat, teamLink } from "../../lib/helper";

export async function playerDetails(req: Request) {
  let html = "";
  let team = "";
  let matches = 0;
  let minutes = 0;
  let avgRating = 0;
  let avgCond = 0;
  let totalGoals = 0;
  let totalAssists = 0;
  let totalSaves = 0;
  let totalYellows = 0;
  let totalReds = 0;
  let totalOGoals = 0;
  let aliases: Set<string> = new Set();
  let motm = 0;
  let pName = "";

  let linkID = parseInt(req.params.linkID.split("-")[0]);

  let playerData = await getPlayers({ linkID });
  team = playerData[0].playerlink.team;
  pName = playerData[0].playerlink.name;

  aliases = new Set(playerData.map((x) => x.player.name.trim()));

  let cupList = playerData.map((x) => x.cup.cupID);
  const cups = await getCups({ cupList, asc: true });
  let totalMatchHtml = `<table id='matchTable'>
            <tr>
                <th>Cup</th>
                <th>Pos</th>
                <th>Round</th>
                <th>Date</th>
                <th>Team</th>
                <th>Play Time</th>
                <th>Cond</th>
                <th>Rating</th>
                <th>Events</th>
            </tr>`;
  for (const cup of cups) {
    const perfData = await getPerformances({ cupID: cup.cupID, linkID });
    let matchesPlayed = [];
    let pos = "";
    let medal = "";
    for (const { match, performance, player } of perfData) {
      if (match.valid) {
        matches++;
      }
      pos = player.regPos;
      medal = player.medal;
      minutes +=
        performance.subOn >= 0 && performance.subOff >= 0 && match.valid
          ? performance.subOff - performance.subOn
          : 0;
      avgRating +=
        match.valid && performance.rating > 0 ? performance.rating : 0;
      avgCond += match.valid && performance.cond > 0 ? performance.cond : 0;
      let events: string[] = [];
      let goals: string[] = [];
      let ogoals: string[] = [];
      let assists: string[] = [];
      let yellows: string[] = [];
      let reds: string[] = [];
      let saves = performance.saves >= 0 ? performance.saves : 0;
      if (performance.motm) {
        events.push("Man of the Match");
        if (match.valid) motm++;
      }
      if (saves) {
        events.push("Saves: " + saves);
        if (match.valid) totalSaves += saves;
      }
      const eventData = await getEvents({ linkID, matchID: match.matchID });
      for (const { event } of eventData) {
        switch (event.eventType) {
          case 1:
          case 4:
            if (match.valid) totalGoals++;
            goals.push(
              event.regTime +
                `'` +
                (event.injTime >= 0 ? `+${event.injTime}` : "")
            );
            break;
          case 2:
            if (match.valid) totalAssists++;
            assists.push(
              event.regTime +
                `'` +
                (event.injTime >= 0 ? `+${event.injTime}` : "")
            );
            break;
          case 3:
            if (match.valid) totalOGoals++;
            ogoals.push(
              event.regTime +
                `'` +
                (event.injTime >= 0 ? `+${event.injTime}` : "")
            );
            break;
          case 5:
            if (match.valid) totalYellows++;
            yellows.push(
              event.regTime +
                `'` +
                (event.injTime >= 0 ? `+${event.injTime}` : "")
            );
            break;
          case 6:
          case 8:
            if (match.valid) totalReds++;
            reds.push(
              event.regTime +
                `'` +
                (event.injTime >= 0 ? `+${event.injTime}` : "")
            );
            break;
        }
      }
      let eventList = [
        ["Goals", goals],
        ["Own Goals", ogoals],
        ["Assists", assists],
        ["Yellows", yellows],
        ["Reds", reds],
      ];
      for (let event of eventList) {
        if (event[1].length && typeof event[1] !== "string") {
          events.push(
            `${event[0]}: ${event[1].length}(${event[1].join(", ")})`
          );
        }
      }
      matchesPlayed.push({
        result: match.valid
          ? match.winningTeam == "draw"
            ? "D"
            : match.winningTeam == team
            ? "W"
            : "L"
          : "V",
        round: match.round,
        date: dateFormat(match.utcTime, "short"),
        team: match.homeTeam == team ? match.awayTeam : match.homeTeam,
        played: `${performance.subOn} - ${performance.subOff}`,
        cond: performance.cond,
        rating: performance.rating,
        events: events,
        mNum: match.valid ? matches : "",
      });
    }
    let matchHtml = "";
    if (matchesPlayed.length) {
      for (let i in matchesPlayed) {
        let match = matchesPlayed[i];
        matchHtml += `<tr>`;
        if (i == "0") {
          matchHtml += `
                        <th rowspan=${matchesPlayed.length}>${cupShort(
            cup.cupName
          )}</th>
                        <th rowspan=${
                          matchesPlayed.length
                        } class=${medal}>${pos}</th>`;
        }
        matchHtml += `
                        <td class='${match.result}'>${match.round}</td>
                        <td class='${match.result}'>${match.date}</td>
                        <td class='${match.result}'>/${match.team}/</td>
                        <td class='${match.result}'>${match.played}</td>
                        <td class='${match.result}'>${match.cond}</td>
                        <td class='${match.result}'>${match.rating}</td>
                        <td class='${match.result}'>${match.events.join(
          "<br>"
        )}</td>
                        <td>${match.mNum}</td>
                    `;
        matchHtml += `</tr>`;
      }
    } else {
      matchHtml += `
                    <tr>
                    <th>${cupShort(cup.cupName)}</th>
                    <th class=${medal}>${pos}</th>
                    <td colspan=7 style='text-align:center'>Did not play</td>
                    </tr>`;
    }
    totalMatchHtml += matchHtml;
  }
  let cleanSheets = 0;
  let optionalStats = [
    ["MotM", motm],
    ["Goals", totalGoals],
    ["Assists", totalAssists],
    ["Saves", totalSaves],
    ["Clean Sheets", cleanSheets],
    ["Yellow Cards", totalYellows],
    ["Red Cards", totalReds],
  ];
  let overallHtml = `<table>
            <tr>
                <th>Cups</th>
                <td>${playerData.length}</th>
            </tr><tr>
                <th>Matches</th>
                <td>${matches}</th>
            </tr><tr>
                <th>Minutes</th>
                <td>${minutes}</th>
            </tr><tr>
                <th>Avg Rating</th>
                <td>${
                  matches ? Math.round((avgRating * 100) / matches) / 100 : "-"
                }</th>
            </tr><tr>
                <th>Avg Cond</th>
                <td>${
                  matches ? Math.round((avgCond * 100) / matches) / 100 : "-"
                }</th>
            </tr>`;
  for (let optionalStat of optionalStats) {
    if (typeof optionalStat[1] == "number" && optionalStat[1] > 0) {
      overallHtml += `<tr>
                    <th>${optionalStat[0]}</th>
                    <td>${optionalStat[1]} (${
        Math.round((optionalStat[1] * 100) / matches) / 100
      })</td>
                </tr>
                `;
    }
  }
  overallHtml += `<tr><th colspan=2>Aliases</th></tr>${Array.from(aliases)
    .map((x) => `<tr><td colspan=2>${x}</td></tr>`)
    .join("")}`;
  let headerHtml = `<h2>${teamLink(team)} - ${pName}</h2>`;
  html = headerHtml + overallHtml + `</table>` + totalMatchHtml + `</table>`;
  html += `<STYLE>table{display:inline-block;vertical-align:top;margin:1rem}</STYLE>`;
  return {
    html,
    playerName: pName,
    playerTeam: team,
    date: new Date().toLocaleString("en-us", {
      timeStyle: "short",
      dateStyle: "medium",
    }),
  };
}