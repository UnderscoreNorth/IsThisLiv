import { Request } from "express";
import {
  getCups,
  getEvents,
  getPerformances,
  getPlayers,
} from "../../db/commonFn";
import {
  cupShort,
  dateFormat,
  goalTypes,
  goalTypesOG,
  teamLink,
} from "../../lib/helper";

export async function playerDetails(req: Request) {
  let html = "";
  let team = "";
  let matches = 0;
  let ratedMatches = 0;
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
  if (!linkID) return {};
  let playerData = await getPlayers({ linkID, getFriendlies: true });
  if (!playerData[0]) return {};
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
                <th>Score</th>
                <th>Play Time</th>
                <th>Cond</th>
                <th>Rating</th>
                <th>Events</th>
            </tr>`;
  for (const cup of cups) {
    const perfData = await getPerformances({
      cupID: cup.cupID,
      linkID,
      getFriendlies: true,
      getVoided: true,
    });
    let matchesPlayed = [];
    let pos = "";
    let medal = "";
    for (const { match, performance, player } of perfData) {
      if (match.valid) {
        matches++;
        if (performance.rating > 0) {
          ratedMatches++;
        }
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
      let matchGoals = 0;
      let matchAGoals = 0;
      if (performance.motm) {
        events.push("Man of the Match");
        if (match.valid) motm++;
      }
      if (saves) {
        events.push("Saves: " + saves);
        if (match.valid) totalSaves += saves;
      }
      const eventData = await getEvents({
        matchID: match.matchID,
        getVoided: true,
      });
      for (const { event, player } of eventData) {
        if (goalTypes.includes(event.eventType) && player.team == team)
          matchGoals++;
        if (goalTypes.includes(event.eventType) && player.team !== team)
          matchAGoals++;
        if (goalTypesOG.includes(event.eventType) && player.team == team)
          matchAGoals++;
        if (goalTypesOG.includes(event.eventType) && player.team !== team)
          matchGoals++;
        if (player.linkID !== linkID) continue;
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
        matchGoals,
        matchAGoals,
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
          )}<br><img src="/icons/cups/${cup.cupID}.png" style="
                width: 4rem;
            "></th>
                        <th rowspan=${
                          matchesPlayed.length
                        } class=${medal}>${pos}</th>`;
        }
        matchHtml += `
                        <td class='${match.result}'>${match.round}</td>
                        <td class='${match.result}'>${match.date}</td>
                        <td class='${match.result}'>${teamLink(
          match.team,
          "left"
        )}</td>
                        <td class='${match.result} nowrap'>${
          match.matchGoals
        } - ${match.matchAGoals}</td>
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
                    <th>${cupShort(cup.cupName)}<br><img src="/icons/cups/${
        cup.cupID
      }.png" style="
                    width: 4rem;
                "></th>
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
                  ratedMatches
                    ? Math.round((avgRating * 100) / ratedMatches) / 100
                    : "-"
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
  html = overallHtml + `</table>` + totalMatchHtml + `</table>`;
  html += `<STYLE>table{display:inline-block;vertical-align:top;margin:1rem} .nowrap{white-space:nowrap} td a{color:black}</STYLE>`;
  return {
    html,
    linkID,
    playerName: pName,
    playerTeam: team,
    date: new Date().toLocaleString("en-us", {
      timeStyle: "short",
      dateStyle: "medium",
    }),
  };
}
