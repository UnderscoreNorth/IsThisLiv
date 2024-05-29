import { Request } from "express";
import {
  getCups,
  getCupTeams,
  getEvents,
  getMatches,
  getMost,
} from "../../db/commonFn";
import {
  cupLink,
  goalTypes,
  goalTypesOG,
  playerLink,
  redCardTypes,
  teamLink,
  yellowCardTypes,
} from "../../lib/helper";

export async function cupsOverview(req: Request) {
  let result = [];
  let cups = await getCups();
  let wikiText = ``;
  for (const cup of cups) {
    let teams = await getCupTeams(cup.cupID);
    let matches = (await getMatches({ cupID: cup.cupID, sort: "desc" })).map(
      (x) => x.match
    );
    let places = ["", "", "", ""];
    if (cup.cupType < 3 && cup.end < new Date()) {
      for (const match of matches.sort((a, b) => {
        if (a.utcTime > b.utcTime) return -1;
        if (a.utcTime < b.utcTime) return 1;
        if (a.matchID > b.matchID) return -1;
        return 1;
      })) {
        const winner = teamLink(match.winningTeam);
        const loser = teamLink(
          match.homeTeam == match.winningTeam ? match.awayTeam : match.homeTeam
        );
        for (let i = 0; i < 4; i++) {
          if (places[i]) continue;
          if (!places.slice(0, i).includes(winner)) {
            places[i] = winner;
            continue;
          }
          if (!places.slice(0, i).includes(loser)) {
            places[i] = loser;
            continue;
          }
        }
        if (places[3]) break;
      }
    }
    let [first, second, third, fourth] = places;
    let etMatches = matches.filter((m) => m.endPeriod > 1).length;
    let penMatches = matches.filter((m) => m.endPeriod == 3).length;
    let goals = (
      await getEvents({
        eventTypes: [...goalTypes, ...goalTypesOG],
        cupID: cup.cupID,
      })
    ).length;
    let yellows = (
      await getEvents({ eventTypes: yellowCardTypes, cupID: cup.cupID })
    ).length;
    let reds = (await getEvents({ eventTypes: redCardTypes, cupID: cup.cupID }))
      .length;
    let goldenBootLink = await getMost("goals", cup.cupID);
    let goldenBoot =
      goldenBootLink.length && goldenBootLink[0].linkID
        ? (await playerLink(goldenBootLink[0].linkID)) +
          ` (${goldenBootLink[0].count})`
        : "";
    let goldenBallLink = await getMost("assists", cup.cupID);
    let goldenBall =
      goldenBallLink.length && goldenBallLink[0].linkID
        ? (await playerLink(goldenBallLink[0].linkID)) +
          ` (${goldenBallLink[0].count})`
        : "";
    let goldenGloveLink = await getMost("saves", cup.cupID);
    let goldenGlove =
      goldenGloveLink.length && goldenGloveLink[0].linkID
        ? (await playerLink(goldenGloveLink[0].linkID)) +
          ` (${goldenGloveLink[0].count})`
        : "";
    const per = (num: number) => {
      return matches.length > 0
        ? Math.round((num / matches.length) * 100) / 100
        : 0;
    };
    let row = [
      await cupLink(cup.cupID, { logo: true }),
      teams.length,
      matches.length,
      first,
      second,
      third,
      fourth,
      etMatches,
      penMatches,
      `${goals} (${per(goals)})`,
      goldenBoot,
      goldenBall,
      goldenGlove,
      `${yellows} (${per(yellows)})`,
      `${reds} (${per(reds)})`,
    ];
    result.push(row);
  }
  return result;
}
