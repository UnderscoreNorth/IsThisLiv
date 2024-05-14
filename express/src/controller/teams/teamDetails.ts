import { Request } from "express";
import {
  getEvents,
  getMatches,
  getPerformances,
  getPlayers,
} from "../../db/commonFn";
import {
  assistTypes,
  cupShort,
  dateFormat,
  goalTypes,
  goalTypesOG,
  playerLink,
  teamLink,
  avg,
  sum,
} from "../../lib/helper";

export async function teamDetails(req: Request) {
  let team = req.params.teamID.split("-")[0];
  const matchData = await getMatches({
    team,
    getVoided: true,
    getUnofficial: true,
  });
  if (!matchData.length) return {};
  let Btemplate = {
    gd: 0,
    results: [],
  };
  let stats = {
    1: { bWin: { ...Btemplate }, bLose: { ...Btemplate }, cups: {} },
    2: { bWin: { ...Btemplate }, bLose: { ...Btemplate }, cups: {} },
    4: { bWin: { ...Btemplate }, bLose: { ...Btemplate }, cups: {} },
  };
  let matches = [];
  let offMatches = 0;
  for (const { match, cup } of matchData) {
    const eventData = await getEvents({
      matchID: match.matchID,
      eventTypes: [...goalTypes, ...goalTypesOG],
    });
    let tg =
      eventData.filter(({ event, player }) => {
        return (
          (goalTypesOG.includes(event.eventType) && player.team !== team) ||
          (goalTypes.includes(event.eventType) && player.team == team)
        );
      }).length || 0;
    let eg =
      eventData.filter(({ event, player }) => {
        return (
          (goalTypesOG.includes(event.eventType) && player.team == team) ||
          (goalTypes.includes(event.eventType) && player.team !== team)
        );
      }).length || 0;
    let gd = tg - eg;
    let e = match.homeTeam == team ? match.awayTeam : match.homeTeam;

    const scorers: Record<number, { id: number; goals: string[] }> = {};
    for (const { event, player } of eventData) {
      if (!(goalTypes.includes(event.eventType) && player.team == team))
        continue;
      const pID = player.team == team ? player.linkID : 0;
      if (scorers[pID] == undefined) scorers[pID] = { id: pID, goals: [] };
      let goal = event.regTime.toString();
      if (event.injTime >= 0) goal += "+" + event.injTime;
      goal += `'`;
      scorers[pID].goals.push(goal);
    }
    let scorerArr = Object.values(scorers);
    scorerArr.sort((a, b) => {
      if (a.goals[0] > b.goals[0]) return 1;
      if (a.goals[0] < b.goals[0]) return -1;
      return 0;
    });
    if (match.valid) offMatches++;
    let matchT = {
      cup: cupShort(cup.cupName),
      cupID: cup.cupID,
      round: match.round,
      date: dateFormat(match.utcTime, "short"),
      team: e,
      result: `${tg} - ${eg}`,
      scorers: scorerArr,
      num: match.valid ? offMatches : "",
      status: "",
    };
    if (!match.valid) {
      matchT.status = "V";
    } else if (team == match.winningTeam) {
      matchT.status = "W";
    } else if (match.winningTeam == e) {
      matchT.status = "L";
    } else {
      matchT.status = "D";
    }
    matches.push(matchT);
    if (match.valid) {
      if (cup.cupType == 3) cup.cupType = 2;
      let cupSeason = cup.year + cup.season;
      if (stats[cup.cupType].cups[cupSeason] == undefined) {
        stats[cup.cupType].cups[cupSeason] = {
          wins: 0,
          draws: 0,
          losses: 0,
          gf: 0,
          ga: 0,
        };
      }
      if (team == match.winningTeam) {
        stats[cup.cupType].cups[cupSeason].wins++;
      } else if (match.winningTeam == e) {
        stats[cup.cupType].cups[cupSeason].losses++;
      } else {
        stats[cup.cupType].cups[cupSeason].draws++;
      }
      stats[cup.cupType].cups[cupSeason].gf += +tg;
      stats[cup.cupType].cups[cupSeason].ga += +eg;
      if (gd > stats[cup.cupType].bWin.gd) {
        stats[cup.cupType].bWin.gd = gd;
        stats[cup.cupType].bWin.results = [
          `${tg} - ${eg} /${e}/ ${dateFormat(match.utcTime)}`,
        ];
      } else if (gd == stats[cup.cupType].bWin.gd) {
        stats[cup.cupType].bWin.results.push(
          `${tg} - ${eg} /${e}/ ${dateFormat(match.utcTime)}`
        );
      }
      if (gd < stats[cup.cupType].bLose.gd) {
        stats[cup.cupType].bLose.gd = gd;
        stats[cup.cupType].bLose.results = [
          `${tg} - ${eg} /${e}/ ${dateFormat(match.utcTime)}`,
        ];
      } else if (gd == stats[cup.cupType].bLose.gd) {
        stats[cup.cupType].bLose.results.push(
          `${tg} - ${eg} /${e}/ ${dateFormat(match.utcTime)}`
        );
      }
    }
  }
  let statsHtml = `<h3 id='stats'>Stats</h3><table>
            <tr>
                <th></th>
                <th>App</th>
                <th>W</th>
                <th>D</th>
                <th>L</th>
                <th>Tot</th>
                <th>Eff</th>
                <th>GF</th>
                <th>GA</th>
                <th>GD</th>
                <th>Biggest Win</th>
                <th>Biggest Defeat</th>
            </tr>`;
  let tWins = 0;
  let tDraws = 0;
  let tLosses = 0;
  let tTotal = 0;
  let tGf = 0;
  let tGa = 0;
  let tGd = 0;
  let tEff = 0;
  let tApps = 0;
  for (let i in stats) {
    let statName = i == "1" ? "Elite" : i == "2" ? "Babby" : "Off Friendlies";
    statsHtml += `<tr>`;
    statsHtml += `<th colspan=${i == "4" ? 2 : 1}>${statName}</th>`;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let total = 0;
    let gf = 0;
    let ga = 0;
    let gd = 0;
    let eff = 0;
    let apps = 0;
    for (let j in stats[i].cups) {
      wins += stats[i].cups[j].wins;
      draws += stats[i].cups[j].draws;
      losses += stats[i].cups[j].losses;
      gf += stats[i].cups[j].gf;
      ga += stats[i].cups[j].ga;
    }
    total = wins + draws + losses;
    gd = gf - ga;
    eff = total ? Math.round((wins / total) * 10000) / 100 : 0;
    if (i != "4") {
      apps = Object.keys(stats[i].cups).length;
      statsHtml += `<td>${apps}</td>`;
    }
    tWins += wins;
    tDraws += draws;
    tLosses += losses;
    tGf += gf;
    tGa += ga;
    tApps += apps;
    statsHtml += `
                <td>${wins}</td>
                <td>${draws}</td>
                <td>${losses}</td>
                <td>${total}</td>
                <td>${eff}%</td>
                <td>${gf}</td>
                <td>${ga}</td>
                <td>${gd}</td>
                <td>${stats[i].bWin.results.join("<br>")}</td>
                <td>${stats[i].bLose.results.join("<br>")}</td>
            `;
    statsHtml += `</tr>`;
  }
  tTotal = tWins + tDraws + tLosses;
  tGd = tGf - tGa;
  tEff = tTotal ? Math.round((tWins / tTotal) * 10000) / 100 : 0;
  statsHtml += `
                <tr>
                <th>Overall</th>
                <th>${tApps}</td>
                <td>${tWins}</td>
                <td>${tDraws}</td>
                <td>${tLosses}</td>
                <td>${tTotal}</td>
                <td>${tEff}%</td>
                <td>${tGf}</td>
                <td>${tGa}</td>
                <td>${tGd}</td>
                </tr>
            `;
  statsHtml += `</table>`;
  let matchesHtml = `<h3 id='matches'>Matches</h3><table>
    <tr>
      <th>Cup</th>
      <th>Round</th>
      <th>Date</th>
      <th>Team</th>
      <th>Result</th>
      <th>Scorers</th>
    </tr>`;
  let cup = "";
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    matchesHtml += `<tr class=${match.status}>`;
    if (cup != match.cup) {
      cup = match.cup;
      let cupNum = 0;
      for (let j = i; j < matches.length; j++) {
        if (matches[j].cup == cup) {
          cupNum++;
        } else {
          break;
        }
      }
      matchesHtml += `<th style='background:var(--bg-color);color:var(--fg-color);vertical-align:top' rowspan=${cupNum}>${match.cup}<br><img src="/icons/cups/${match.cupID}.png" style="
      width: 4rem;
  "></th>`;
    }
    let scorers = [];
    for (let player of match.scorers) {
      let goalStr = "";
      if (player.id == 0) {
        goalStr += "Own Goal ";
      } else {
        goalStr += (await playerLink(player.id)) + " ";
      }
      goalStr += player.goals.join(", ");
      scorers.push(goalStr);
    }
    matchesHtml += `
        <td>${match.round}</td>
        <td>${match.date}</td>
        <td>${teamLink(match.team)}</td>
        <td>${match.result}</td>
        <td>${scorers.join("<br>")}</td>
        <td style='background:var(--bg-color);color:var(--fg-color)'>${
          match.num
        }</td>
      `;
  }
  matchesHtml += "</table>";

  //Roster
  let avgList = [];
  let arr: Record<
    number,
    {
      id: number;
      cups: number;
      name: string;
      truename: string;
      apps: number;
      goals: number;
      assists: number;
      rating: number;
      saves: number;
    }
  > = {};
  const cupsSet: Set<string> = new Set();
  const playerData = await getPlayers({ team });
  for (const p of playerData) {
    if (arr[p.player.linkID] == undefined) {
      const eventData = await getEvents({ linkID: p.player.linkID });
      const perfData = await getPerformances({ linkID: p.player.linkID });
      arr[p.player.linkID] = {
        id: p.player.linkID,
        cups: 0,
        name: await playerLink(p.player.linkID),
        truename: playerLink.name,
        apps: perfData.length,
        goals: eventData.filter(({ event }) => {
          return goalTypes.includes(event.eventType);
        }).length,
        assists: eventData.filter(({ event }) => {
          return assistTypes.includes(event.eventType);
        }).length,
        rating: avg(
          perfData
            .filter(({ performance }) => {
              return performance.rating > -1;
            })
            .map((e) => e.performance.rating)
        ),
        saves: sum(
          perfData
            .filter(({ performance }) => {
              return performance.saves > -1;
            })
            .map((e) => e.performance.saves)
        ),
      };
      avgList.push(perfData.length);
    }

    let data: number;
    if (p.player.medal == "Gold") {
      data = 5;
    } else if (p.player.medal == "Silver") {
      data = 4;
    } else if (p.player.medal == "Bronze") {
      data = 3;
    } else if (p.player.starting) {
      data = 2;
    } else {
      data = 1;
    }
    if (p.player.captain) data += 0.5;
    arr[p.player.linkID][p.cup.year.toString() + p.cup.season] = data;
    cupsSet.add(p.cup.year.toString() + p.cup.season);
    arr[p.player.linkID].cups++;
  }
  let players = Object.values(arr);
  let rosterHeader = [];
  rosterHeader.push([
    { text: "Roster Timeline", sort: "truename", dir: true },
    { text: "Apps", sort: "apps" },
    { text: "Cups", sort: "cups" },
    { text: "G", sort: "goals" },
    { text: "A", sort: "assists" },
    { text: "S", sort: "saves" },
    { text: "R", sort: "rating" },
  ]);
  let i = 0;
  if (cupsSet.size == 0) return {};
  let cups = Array.from(cupsSet)
    .map((x) => {
      return { year: x.substring(0, 4), season: x.substring(4) };
    })
    .sort();
  do {
    const cup = cups[i];
    let yearLength = 0;
    for (let j = i; j < cups.length; j++) {
      if (cup.year == cups[j].year) {
        yearLength++;
      } else {
        break;
      }
    }
    rosterHeader[0].push({ text: cup.year, colSpan: yearLength });
    i += yearLength;
  } while (i < cups.length);
  rosterHeader.push([{ text: "", colSpan: 7 }]);
  for (let cup of cups) {
    rosterHeader[1].push({
      text: cup.season.substring(0, 3),
      sort: cup.year + cup.season,
    });
  }
  let rosterFooter = `<tr><td>Average Tenure</td><td></td><td>${avg(
    avgList
  )}</td></tr>`;
  let html =
    statsHtml +
    matchesHtml +
    `<STYLE>
      .t5{
        background:#E0C068;
        color:#E0C068;
        width:20px;
      }
      .t4{
        background:#B7BEC5;
        color:#B7BEC5;
      }
      .t3{
        background:#BE9588;
        color:#BE9588;
      }
      .t2{
        background:#88C594;
        color:#88C594;
      }
      .t1{
        background:#AFE5BA;
        color:#AFE5BA;
      }
      .no{
        opacity:0;
      }
      .cap::after{
        content:" C";
        color:black;
      }
      .W a,
    .D a,
    .L a,
    .V a {
      color: black !important;
    }</STYLE>`;
  return {
    html,
    roster: {
      header: rosterHeader,
      footer: rosterFooter,
      data: players,
      cups,
    },
    date: new Date().toLocaleString("en-us", {
      timeStyle: "short",
      dateStyle: "medium",
    }),
  };
}
