import { Request } from "express";
import { db } from "../../../db";
import { Cup, Match, Team } from "../../../db/schema";
import { and, desc, eq, InferSelectModel, lte, or } from "drizzle-orm";
import { cupLink, dateFormat, keySort, teamLink } from "../../../lib/helper";

export async function rematches(req: Request) {
  let result: {
    list: Array<{
      team1: string;
      team2: string;
      matchArr: Array<[string, string, Date, InferSelectModel<typeof Cup>]>;
    }>;
  } = { list: [] };
  let html = "<h2>Rematches</h2>";
  let teams = (await db.select().from(Team)).map((x) => x.team);
  let usedTeams: Record<string, Set<string>> = {};
  for (let team1 of teams) {
    if (usedTeams[team1] == undefined) usedTeams[team1] = new Set();
    for (let team2 of teams) {
      if (team1 !== team2) {
        let matches = await db
          .select()
          .from(Match)
          .innerJoin(Cup, eq(Match.cupID, Cup.cupID))
          .where(
            and(
              lte(Cup.cupType, 3),
              eq(Match.valid, 1),
              or(
                and(eq(Match.homeTeam, team1), eq(Match.awayTeam, team2)),
                and(eq(Match.homeTeam, team2), eq(Match.awayTeam, team1))
              )
            )
          )
          .orderBy(desc(Match.utcTime));
        let matchArr = [];
        if (usedTeams[team2]?.has(team1)) continue;
        usedTeams[team1].add(team2);
        for (const { match, cup } of matches) {
          matchArr.push([match.round, match.winningTeam, match.utcTime, cup]);
        }
        if (matchArr.length >= 6) {
          result.list.push({ team1, team2, matchArr });
        }
      }
    }
  }
  result.list.sort((a, b) => {
    if (a.matchArr.length > b.matchArr.length) return -1;
    if (a.matchArr.length < b.matchArr.length) return 1;
    return 0;
  });
  html += "<div class='rmCat'><table>";
  html +=
    "<tr><th># Times<br>Played</th><th>Teams</th><th>Match</th><th>Winner</th><th>Date</th></tr>";

  for (let matchup of result.list) {
    let t1 = 0,
      t2 = 0,
      t3 = 0;
    for (let subresult of matchup.matchArr) {
      if (subresult[1] == matchup.team1) {
        t1++;
      } else if (subresult[1] == matchup.team2) {
        t2++;
      } else if (subresult[1] == "draw") {
        t3++;
      }
    }
    html += `<tr><td rowspan=${
      matchup.matchArr.length
    } style='vertical-align:top'>${matchup.matchArr.length}</td><td rowspan=${
      matchup.matchArr.length
    } style='vertical-align:top;text-align:center'>${teamLink(
      matchup.team1,
      "right"
    )} - ${teamLink(matchup.team2, "left")}<br>${t1} - ${t3} - ${t2}</td>`;
    let first = true;
    for (let subresult of matchup.matchArr) {
      if (first) {
        first = false;
      } else {
        html += "<tr>";
      }
      html += `<td>${await cupLink(subresult[3], {
        logo: true,
        format: "short",
        text: subresult[0],
      })}</td><td>${teamLink(subresult[1], "left")}</td><td>${dateFormat(
        subresult[2]
      )}</td></tr>`;
    }
  }

  html += "</table></div><div class='rmCat'>";
  let fastest = [];
  const min = 3;
  const max = 9;
  for (let i = min; i <= max; i++) {
    fastest[i] = [];
  }
  for (let team of teams) {
    let arr = {};
    let matches = await db
      .select()
      .from(Match)
      .innerJoin(Cup, eq(Cup.cupID, Match.cupID))
      .where(
        and(
          or(eq(Match.homeTeam, team), eq(Match.awayTeam, team)),
          eq(Match.valid, 1),
          lte(Cup.cupType, 3)
        )
      )
      .orderBy(Match.utcTime);
    let i = 0;
    for (let { match } of matches) {
      i++;
      let at = match.homeTeam == team ? match.awayTeam : match.homeTeam;
      arr[at] = arr[at] || [];
      arr[at].push({ num: i, date: match.utcTime, round: match.round });
    }
    for (let i = min; i <= max; i++) {
      for (let at in arr) {
        let matches = arr[at];
        if (matches.length >= i) {
          for (let j = 0; j <= matches.length - i; j++) {
            let firstMatch = matches[j];
            let lastMatch = matches[i + j - 1];
            fastest[i].push({
              num: lastMatch.num - firstMatch.num + 1,
              t1: team,
              t2: at,
              firstMatch: `${firstMatch.round} ${dateFormat(firstMatch.date)}`,
              lastMatch: `${lastMatch.round} ${dateFormat(lastMatch.date)}`,
            });
          }
        }
      }
    }
  }
  for (let i = min; i <= max; i++) {
    fastest[i] = keySort(fastest[i], "num", false);
    html += `<h3>Fastest to play ${i} times</h3>
            <table><tr><th>Team</th><th>Opponent</th><th>First Match</th><th>Last Match</th><th>Done in # matches</th></tr>`;
    for (let j = 0; j < 25; j++) {
      if (!fastest[i][j]) break;
      html += `<tr><td style='text-align:right'>${teamLink(
        fastest[i][j].t1,
        "right"
      )}</td><td>${teamLink(fastest[i][j].t2, "left")}</td><td>${
        fastest[i][j].firstMatch
      }</td><td>${fastest[i][j].lastMatch}</td><td>${
        fastest[i][j].num
      }</td></tr>`;
    }
    html += "</table>";
  }
  html += `</div><STYLE>.rmCat{display: inline-block;
    vertical-align: top;
    margin-right: 100px;}
    td{text-align:left;}</STYLE>`;
  return { html, date: new Date() };
}
