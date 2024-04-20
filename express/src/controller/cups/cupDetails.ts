import { Request } from "express";
import { db } from "../../db";
import {
  getCup,
  getCupTeams,
  getEvents,
  getMatches,
  getPerformances,
} from "../../db/commonFn";
import {
  assistTypes,
  goalTypes,
  goalTypesOG,
  playerLink,
  redCardTypes,
  teamLink,
  yellowCardTypes,
} from "../../lib/helper";
type Matches = Record<
  "groups" | "kos",
  {
    name: string;
    matches: [
      {
        date: string;
        time: string;
        stadium: string;
        attendance: number;
        home: string;
        away: string;
        winner: string;
        homeg: number;
        awayg: number;
        id: number;
        official: number;
        roundOrder: number;
      }
    ];
    table: any;
  }[]
>;
type Result = {
  teams: string[];
  cupID: number;
  cupName: string;
  dates: string;
  matches: Matches;
  goals: number;
  numMatches: number;
  gpm: number;
  scorers: any[];
  assisters: any[];
  owngoalers: any[];
  goalies: any[];
  cards: any[];
};

export async function cupDetails(req: Request) {
  let cupID = parseInt(req.params.cupID.split("-")[0]);
  let teams = [];
  let cupMeta = await getCup(cupID);
  let totalGoals = 0;
  let totalMatches = 0;
  let scorers = {};
  let owngoalers = {};
  let assisters = {};
  let goalies = {};
  let motms = {};
  let cards = {};
  if (!cupMeta) return {};
  /*sql = await DB.query(
    "SELECT * FROM MatchDB INNER JOIN RoundOrder ON MatchDB.sRound = RoundOrder.sRound WHERE iCupID=? ORDER BY iOrder,RoundOrder.sRound,dUTCTime",
    [cupID]
  );*/
  let matches = {};
  for (const p of await getPerformances({ cupID })) {
    if (p.performance.saves > 0) {
      if (goalies[p.player.linkID] == undefined) goalies[p.player.linkID] = 0;
      goalies[p.player.linkID] += p.performance.saves;
    }
    if (p.performance.motm) {
      if (motms[p.player.linkID] == undefined) motms[p.player.linkID] = 0;
      motms[p.player.linkID]++;
    }
  }
  for (const { match, roundorder } of await getMatches({
    cupID,
    getVoided: true,
    getUnofficial: true,
  })) {
    let roundType = "";
    totalMatches++;
    switch (roundorder.order) {
      case 1:
      case 2:
      case 3:
        roundType = "groups";
        break;
      default:
        roundType = "kos";
        break;
    }
    if (typeof matches[roundType] !== "object") matches[roundType] = {};
    if (typeof matches[roundType][match.round] != "object")
      matches[roundType][match.round] = {
        name: match.round,
        matches: [],
        table: {},
      };
    let teams = [match.homeTeam, match.awayTeam];
    for (let team of teams) {
      if (typeof matches[roundType][match.round].table[team] != "object")
        matches[roundType][match.round].table[team] = {
          status: "red",
          data: [teamLink(team, "left"), 0, 0, 0, 0, 0, 0, 0, 0],
        };
    }

    let goals = [0, 0];

    for (const e of await getEvents({
      matchID: match.matchID,
      getVoided: true,
    })) {
      let oTeam = e.player.team;
      let aTeam =
        e.player.team !== match.homeTeam ? match.homeTeam : match.awayTeam;
      if (goalTypes.includes(e.event.eventType)) {
        scorers[e.player.linkID] = scorers[e.player.linkID] || 0;
        scorers[e.player.linkID]++;
        matches[roundType][match.round].table[oTeam].data[5]++;
        matches[roundType][match.round].table[aTeam].data[6]++;
        totalGoals++;
        goals[oTeam == match.homeTeam ? 0 : 1]++;
      } else if (goalTypesOG.includes(e.event.eventType)) {
        owngoalers[e.player.linkID] = owngoalers[e.player.linkID] || 0;
        owngoalers[e.player.linkID]++;
        matches[roundType][match.round].table[oTeam].data[6]++;
        matches[roundType][match.round].table[aTeam].data[5]++;
        totalGoals++;
        goals[oTeam == match.homeTeam ? 1 : 0]++;
      } else if (assistTypes.includes(e.event.eventType)) {
        assisters[e.player.linkID] = assisters[e.player.linkID] || 0;
        assisters[e.player.linkID]++;
      } else if (
        [...yellowCardTypes, ...redCardTypes].includes(e.event.eventType)
      ) {
        cards[e.player.linkID] = cards[e.player.linkID] || 0;
        cards[e.player.linkID]++;
      }
      matches[roundType][match.round].table[oTeam].data[7] =
        matches[roundType][match.round].table[oTeam].data[5] -
        matches[roundType][match.round].table[oTeam].data[6];
      matches[roundType][match.round].table[aTeam].data[7] =
        matches[roundType][match.round].table[aTeam].data[5] -
        matches[roundType][match.round].table[aTeam].data[6];
    }
    for (let team of teams) {
      matches[roundType][match.round].table[team].data[1]++;
      if (match.winningTeam == "draw") {
        matches[roundType][match.round].table[team].data[3]++;
        matches[roundType][match.round].table[team].data[8]++;
      } else if (match.winningTeam == team) {
        matches[roundType][match.round].table[team].data[2]++;
        matches[roundType][match.round].table[team].data[8] += 3;
      } else {
        matches[roundType][match.round].table[team].data[4]++;
      }
    }

    matches[roundType][match.round].matches.push({
      date: match.utcTime.toLocaleDateString(),
      time: match.utcTime.toLocaleTimeString(),
      stadium: match.stadium,
      attendance: match.attendance,
      home: match.homeTeam,
      away: match.awayTeam,
      winner: match.winningTeam,
      homeg: goals[0],
      awayg: goals[1],
      id: match.matchID,
      official: match.official,
      valid: match.valid,
      roundOrder: roundorder.order,
    });
  }
  for (let i in matches) {
    for (let j in matches[i]) {
      matches[i][j].table = Object.values(matches[i][j].table);
      matches[i][j].table = matches[i][j].table.sort((a, b) => {
        if (b.data[8] == a.data[8]) {
          if (b.data[7] == a.data[7]) {
            if (b.data[5] == a.data[5]) {
              return 0;
            } else {
              return b.data[5] - a.data[5];
            }
          } else {
            return b.data[7] - a.data[7];
          }
        } else {
          return b.data[8] - a.data[8];
        }
      });
      matches[i][j].table[0].status = "green";
      matches[i][j].table[1].status = "green";
    }
    matches[i] = Object.values(matches[i]);
  }
  const result: Result = {
    teams: (await getCupTeams(cupID)).sort(),
    cupID: cupID,
    cupName: cupMeta.cupName,
    dates: `${cupMeta.start.toLocaleDateString()} to ${cupMeta.end.toLocaleDateString()}`,
    matches: matches,
    goals: totalGoals,
    numMatches: totalMatches,
    gpm: Math.floor((totalMatches ? totalGoals / totalMatches : 0) * 100) / 100,
    scorers: await sortArray(scorers),
    assisters: await sortArray(assisters),
    owngoalers: await sortArray(owngoalers),
    goalies: await sortArray(goalies),
    cards: await sortArray(cards),
    date: new Date().toLocaleString("en-us", {
      timeStyle: "short",
      dateStyle: "medium",
    }),
  };

  return result;
}
async function sortArray(obj: Record<number, number>) {
  let arr: Array<{ num: number; players: string[] }> = [];
  for (let i in obj) {
    if (arr[obj[i]] == undefined) arr[obj[i]] = { num: obj[i], players: [] };
    arr[obj[i]].players.push(await playerLink(parseInt(i)));
  }
  arr.sort((a, b) => {
    if (a.num > b.num) return -1;
    return 1;
  });
  return arr;
}
