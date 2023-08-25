import DB from "../../lib/db.js";
import {
  teamLink,
  pageExpiry,
  cupLink,
  playerLink,
  cupShort,
  ksort,
} from "../../lib/helper.js";
import fs from "fs/promises";
import sqlGet from "../../lib/sqlGet.js";
import createTable from "../../lib/createTable.js";
class records {
  static main = async (req, res, next) => {
    let stats = await fs.stat(req.staticUrl).catch((err) => {
      return { mtime: new Date("01/01/2000") };
    });
    let result = {};
    let html = "";
    if (new Date() - stats.mtime > pageExpiry) {
      console.log(req.staticUrl);
      //-----------------------
      if (req.staticUrl.includes("Match-Individual")) {
        html = `<h2>Match Records</h2>
                <h3>Individual</h3>`;
        html += await indEvent("Most Goals Scored", "1,4", {});
        html += await indEvent("Most Goals Scored in the First Half", "1,4", {
          eventdb: ["dRegTime <= 45"],
        });
        html += await indEvent("Most Goals Scored in the Second Half", "1,4", {
          eventdb: ["dRegTime > 45 AND dRegTime <= 90"],
        });
        html += await indEvent("Most Goals Scored in Extra Time", "1,4", {
          eventdb: ["dRegTime > 90"],
        });
        html += await indEvent("Most Assists", "2", {});
        html += await indPerf("Most Saves", "SUM(iSaves)", "DESC", {
          performancedb: ["iSaves > 0"],
        });
        html += await indPerf("Highest Rating", "MAX(dRating)", "DESC", {});
        html += await hatTrick("Quickest Brace", 2);
        html += await hatTrick("Quickest Hat Trick", 3);
        html += await hatTrick("Quickest Double Brace", 4);
        //-----------------------
      } else if (req.staticUrl.includes("Match-Team")) {
        html = `<h2>Match Records</h2>
                <h3>Team</h3>`;
        html += await teamStat("Most Shots", "SUM(iShots)", {});
        html += await teamStat("Most Shots on Target", "SUM(iShotsOT)", {});
        html += await teamStat("Most Fouls", "SUM(iFouls)", {});
        html += await teamStat("Most Offsides", "SUM(iOffsides)", {});
        html += await teamStat("Most Free Kicks", "SUM(iFreeKicks)", {});
        html += await teamStat(
          "Most Passes Made (PES18+)",
          "SUM(iPassMade)",
          {}
        );
        html += await teamStat("Most Crosses", "SUM(iCrosses)", {});
        html += await teamStat("Most Interceptions", "SUM(iInterceptions)", {});
        html += await teamStat("Most Tackles", "SUM(iTackles)", {});
        html += await teamStat("Most Saves", "SUM(iSaves)", {});
        html += await teamPerf("Highest Avg Rating", "AVG(dRating)", "DESC", {
          performancedb: ["dRating > 0"],
        });
        html += await teamPerf("Lowest Avg Rating", "AVG(dRating)", "ASC", {
          performancedb: ["dRating > 0"],
        });
        html += await teamPerf("Highest Avg Condition", "AVG(iCond)", "DESC", {
          performancedb: ["iCond > 0"],
        });
        html += await teamPerf("Lowest Avg Condition", "AVG(iCond)", "ASC", {
          performancedb: ["iCond > 0"],
        });
        html += await teamStat("Most Shots all on Target", "SUM(iShotsOT)", {
          none: ["iShots=iShotsOT"],
        });
        html += await teamEvent("Most Cards", "5,6,8", {});
        //-----------------------
      } else if (req.staticUrl.includes("Match-Day")) {
        html = `<h2>Match Records</h2>
                <h3>Day</h3>`;
        html += await dayMatchStat(
          "Most Shots",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iShots)",
          "DESC"
        );
        html += await dayMatchStat(
          "Least Shots",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iShots)",
          "ASC"
        );
        html += await dayMatchStat(
          "Most Shots on Target",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iShotsOT)",
          "DESC"
        );
        html += await dayMatchStat(
          "Least Shots on Target",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iShotsOT)",
          "ASC"
        );
        html += await dayMatchStat(
          "Most Fouls",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iFouls)",
          "DESC"
        );
        html += await dayMatchStat(
          "Least Fouls",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iFouls)",
          "ASC"
        );
        html += await dayMatchStat(
          "Most Offsides",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iOffsides)",
          "DESC"
        );
        html += await dayMatchStat(
          "Least Offsides",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iOffsides)",
          "ASC"
        );
        html += await dayMatchStat(
          "Most Free Kicks",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iFreeKicks)",
          "DESC"
        );
        html += await dayMatchStat(
          "Least Free Kicks",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iFreeKicks)",
          "ASC"
        );
        html += await dayMatchStat(
          "Most Passes Made (PES18+)",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iPassMade)",
          "DESC"
        );
        html += await dayMatchStat(
          "Least Passes Made (PES18+)",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1 AND MatchDB.iPes>=2018",
          "SUM(iPassMade)",
          "ASC"
        );
        html += await dayMatchStat(
          "Most Crosses",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iCrosses)",
          "DESC"
        );
        html += await dayMatchStat(
          "Least Crosses",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iCrosses)",
          "ASC"
        );
        html += await dayMatchStat(
          "Most Interceptions",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iInterceptions)",
          "DESC"
        );
        html += await dayMatchStat(
          "Least Interceptions",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iInterceptions)",
          "ASC"
        );
        html += await dayMatchStat(
          "Most Tackles",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iTackles)",
          "DESC"
        );
        html += await dayMatchStat(
          "Least Tackles",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iTackles)",
          "ASC"
        );
        html += await dayMatchStat(
          "Most Saves",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iSaves)",
          "DESC"
        );
        html += await dayMatchStat(
          "Least Saves",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iSaves)",
          "ASC"
        );
        html += await dayEvent(
          "Most Cards",
          "SUM(CASE WHEN EventDB.iType IN (5,6,8) THEN 1 ELSE 0 END)",
          "DESC"
        );
        html += await dayEvent(
          "Most Goals",
          "SUM(CASE WHEN EventDB.iType IN (1,3,4) THEN 1 ELSE 0 END)",
          "DESC"
        );
        html += await dayEvent(
          "Least Goals",
          "SUM(CASE WHEN EventDB.iType IN (1,3,4) THEN 1 ELSE 0 END)",
          "ASC"
        );
        //-----------------------
      } else if (req.staticUrl.includes("Match-Match")) {
        html = `<h2>Match Records</h2>
            <h3>Match</h3>`;
        html += nonMedal();
        html += matchStat(
          "Most Shots",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iShots)",
          "DESC"
        );
        html += matchStat(
          "Least Shots",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iShots)",
          "ASC"
        );
        html += matchStat(
          "Most Shots on Target",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iShotsOT)",
          "DESC"
        );
        html += matchStat(
          "Least Shots on Target",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iShotsOT)",
          "ASC"
        );
        html += matchStat(
          "Most Fouls",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iFouls)",
          "DESC"
        );
        html += matchStat(
          "Most Offsides",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iOffsides)",
          "DESC"
        );
        html += matchStat(
          "Most Free Kicks",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iFreeKicks)",
          "DESC"
        );
        html += matchStat(
          "Most Passes Made (PES18+)",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iPassMade)",
          "DESC"
        );
        html += matchStat(
          "Most Crosses",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iCrosses)",
          "DESC"
        );
        html += matchStat(
          "Most Interceptions",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iInterceptions)",
          "DESC"
        );
        html += matchStat(
          "Most Tackles",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iTackles)",
          "DESC"
        );
        html += matchStat(
          "Most Saves",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iSaves)",
          "DESC"
        );
        html += attendance();
        html += matchPerfStat("Highest Avg Rating", "dRating", "DESC");
        html += matchPerfStat("Lowest Avg Rating", "dRating", "ASC");
        html += matchPerfStat("Highest Avg Condition", "iCond", "DESC");
        html += matchPerfStat("Lowest Avg Condition", "iCond", "ASC");
        html += eventMat(
          "Most Cards",
          "EventDB.iType IN (5,6,8) AND bVoided = 1 AND CupDB.iType <= 3"
        );
        //-----------------------
      } else if (req.staticUrl.includes("Cup-Individual")) {
        html = `<h2>Cup Records</h2>
        <h3>Individual</h3>`;

        html += await cupEvent("Most Goals Scored", "1,4", {});
        html += await cupEvent("Most Goals Scored (Group Stage)", "1,4", {
          matchdb: [`sRound LIKE 'Group%'`],
        });
        html += await cupEvent("Most Goals Scored (Knockout Stage)", "1,4", {
          matchdb: [`sRound NOT LIKE 'Group%'`],
        });
        html += await cupEvent("Most Assists Scored", "2", {});
        html += await cupEvent("Most Assists Scored (Group Stage)", "2", {
          matchdb: [`sRound LIKE 'Group%'`],
        });
        html += await cupEvent("Most Assists Scored (Knockout Stage)", "2", {
          matchdb: [`sRound NOT LIKE 'Group%'`],
        });
        html += await cupPerf("Most Saves", "SUM(iSaves)", "DESC", {});
        html += await cupPerf(
          "Most Saves (Group Stage)",
          "SUM(iSaves)",
          "DESC",
          {
            matchdb: [`sRound LIKE 'Group%'`],
          }
        );
        html += await cupPerf(
          "Most Saves (Knockout Stage)",
          "SUM(iSaves)",
          "DESC",
          {
            matchdb: [`sRound NOT LIKE 'Group%'`],
          }
        );
      } else if (req.staticUrl.includes("Cup-Team")) {
        html = `<h2>Cup Records</h2>
        <h3>Team</h3>`;

        /*teamStat("Most Shots","bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1 AND iShots > 0", "SUM(iShots)","DESC");
	teamStat("Least Shots","bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1 AND iShots > 0", "SUM(iShots)","ASC");
	teamStat("Most Shots on Target","bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1 AND iShotsOT > 0", "SUM(iShotsOT)","DESC");
	teamStat("Least Shots on Target","bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1 AND iShotsOT > 0", "SUM(iShotsOT)","ASC");
	teamStat("Most Fouls","bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1 AND iFouls > 0", "SUM(iFouls)","DESC");
	teamStat("Most Offsides","bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1 AND iOffsides > 0", "SUM(iOffsides)","DESC");
	teamStat("Most Free Kicks","bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1 AND iFreeKicks > 0", "SUM(iFreeKicks)","DESC");
	teamStat("Least Free Kicks","bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1 AND iFreeKicks > 0", "SUM(iFreeKicks)","ASC");
	teamStat("Most Passes Made (PES18+)","bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1 AND iPassMade > 0", "SUM(iPassMade)","DESC");
	teamStat("Least Passes Made (PES18+)","bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1 AND iPassMade > 0", "SUM(iPassMade)","ASC");
	teamStat("Most Interceptions","bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1 AND iInterceptions > 0", "SUM(iInterceptions)","DESC");
	teamStat("Most Tackles","bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1 AND iTackles > 0", "SUM(iTackles)","DESC");
	teamStat("Most Crosses","bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1 AND iCrosses > 0", "SUM(iCrosses)","DESC");
	teamStat("Highest Avg Possession","bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1 AND iPoss > 0", "AVG(iPoss)","DESC");
	teamStat("Lowest Avg Possession","bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1 AND iPoss > 0", "AVG(iPoss)","ASC");
	teamStat("Most Saves","bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1 AND iSaves > 0", "SUM(iSaves)","DESC");
	eventTeam("Most Cards","EventDB.iType IN (5,6,8) AND bVoided = 1 AND CupDB.iType <= 3");
	goalsForward();*/
      }
      html += `<style>
        table{margin:2rem;display:inline-block;max-width:calc(50% - 2rem);vertical-align:top}
        th{text-align:left}
        </style>`;
      result.html = html;
      await fs.writeFile(req.staticUrl, JSON.stringify(result));
    } else {
      result = JSON.parse(await fs.readFile(req.staticUrl));
    }
    res.send(result);
  };
}
export { records as default };
const cupPlayerHeader = (x) => {
  return `${teamLink(x.sTeam)}</td><td>${x.Player}`;
};
const cupMatchHeader = (x) => {
  return `${x.Cup} ${x.sRound}</td>
  <td>${teamLink(x.sHomeTeam)} - ${teamLink(x.sAwayTeam)}`;
};
const teamMatchHeader = (x) => {
  return `${teamLink(x.sTeam)}</td><td>${x.Cup} ${x.sRound}</td>
  <td>${teamLink(x.sHomeTeam)} - ${teamLink(x.sAwayTeam)}`;
};
const roundAgg = (x) => {
  return Math.round(x.c * 100) / 100;
};
async function attendance() {
  let sql = await DB.query(`
	SELECT 
		sHomeTeam, sAwayTeam, sRound, CupDB.sName AS 'Cup', iAttendence AS 'c'
	FROM 
		MatchDB
		INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iCupID
	WHERE 
		bVoided = 1 AND CupDB.iType <= 3
	ORDER BY
		iAttendence DESC, MatchDB.dUTCTime DESC
	LIMIT
		25`);
  let text = `<table>
		<tr><th colspan=6>Highest Attendance</th></tr>
		<tr>
			<th>#</th><th colspan=2>Match</th>
		</tr>`;
  for (let row of Object.values(sql)) {
    text += `<tr>
                
                <td>${row["c"]}</td>
                <td>${row["Cup"]} ${row["sRound"]}</td>
                <td>${teamLink(row["sHomeTeam"])} - ${teamLink(
      row["sAwayTeam"]
    )}</td>
                </tr>`;
  }
  text += "</table>";
  return text;
}
async function teamPerf(title, stat, dir, wheres) {
  const selects = {
    playerdb: ["sTeam"],
    cupdb: ["sName as Cup"],
    matchdb: ["sRound", "sHomeTeam", "sAwayTeam"],
  };
  let result = await perf(stat, dir, selects, wheres);

  return createTable(
    [
      { header: "Record", custom: roundAgg },
      { header: "Match", colspan: 3, custom: teamMatchHeader },
    ],
    result,
    false,
    title
  );
}
async function cupPerf(title, stat, dir, wheres) {
  const selects = {
    playerdb: ["sName as Player", "sTeam"],
    cupdb: ["sName as Cup"],
  };
  let result = await perf(stat, dir, selects, wheres);

  return createTable(
    [
      { header: "Record", sql: "c" },
      { header: "Player", colspan: 2, custom: cupPlayerHeader },
      { header: "Cup", sql: "Cup" },
    ],
    result,
    false,
    title
  );
}
async function indPerf(title, stat, dir, wheres) {
  const selects = {
    playerdb: ["sName as Player", "sTeam"],
    matchdb: ["sRound", "sHomeTeam", "sAwayTeam"],
    cupdb: ["sName as Cup"],
  };
  let result = await perf(stat, dir, selects, wheres);

  return createTable(
    [
      { header: "Record", sql: "c" },
      { header: "Player", colspan: 2, custom: cupPlayerHeader },
      { header: "Match", colspan: 2, custom: cupMatchHeader },
    ],
    result,
    false,
    title
  );
}
async function perf(stat, dir, selects, wheres) {
  let newWheres = {
    matchdb: ["bVoided=1"],
    cupdb: ["iType <= 3"],
  };

  for (let table in wheres) {
    newWheres[table] = newWheres[table] || [];
    newWheres[table] = newWheres[table].concat(wheres[table]);
  }
  let newSelects = {
    none: [`${stat} AS c`],
  };
  for (let table in selects) {
    newSelects[table] = newSelects[table] || [];
    newSelects[table] = newSelects[table].concat(selects[table]);
  }
  return await sqlGet(
    newSelects,
    selects,
    newWheres,
    [{ performancedb: `${stat} ${dir}` }, { none: "MAX(dUTCTIME) DESC" }],
    25
  );
}
async function teamStat(title, stat, wheres) {
  const selects = {
    matchstatdb: ["sTeam"],
    matchdb: ["sRound", "sHomeTeam", "sAwayTeam"],
    cupdb: ["sName as Cup"],
  };
  let result = await matchStat(stat, selects, wheres);

  return createTable(
    [
      { header: "Record", sql: "c" },
      { header: "Match", colspan: 3, custom: teamMatchHeader },
    ],
    result,
    false,
    title
  );
}

async function matchStat(stat, selects, wheres) {
  let newWheres = {
    matchdb: ["bVoided=1"],
    cupdb: ["iType <= 3"],
    matchstatdb: ["bFinal = 1"],
  };

  for (let table in wheres) {
    newWheres[table] = newWheres[table] || [];
    newWheres[table] = newWheres[table].concat(wheres[table]);
  }
  let newSelects = {
    none: [`${stat} AS c`],
  };
  for (let table in selects) {
    newSelects[table] = newSelects[table] || [];
    newSelects[table] = newSelects[table].concat(selects[table]);
  }
  return await sqlGet(
    newSelects,
    selects,
    newWheres,
    [{ matchstatdb: `${stat} DESC` }, { none: "MAX(dUTCTIME) DESC" }],
    25
  );
}
async function teamEvent(title, eventTypes, wheres) {
  const selects = {
    playerdb: ["sTeam"],
    matchdb: ["sRound", "sHomeTeam", "sAwayTeam"],
    cupdb: ["sName as Cup"],
  };
  let result = await event(eventTypes, selects, wheres);
  return createTable(
    [
      { header: "Record", sql: "c" },
      { header: "Match", colspan: 3, custom: teamMatchHeader },
    ],
    result,
    false,
    title
  );
}

async function cupEvent(title, eventTypes, wheres) {
  const selects = {
    playerdb: ["sName as Player", "sTeam"],
    cupdb: ["sName as Cup"],
  };
  let result = await event(eventTypes, selects, wheres);
  return createTable(
    [
      { header: "Record", sql: "c" },
      { header: "Player", colspan: 2, custom: cupPlayerHeader },
      { header: "Cup", sql: "Cup" },
    ],
    result,
    false,
    title
  );
}

async function indEvent(title, eventTypes, wheres) {
  const selects = {
    playerdb: ["sName as Player", "sTeam"],
    matchdb: ["sRound", "sHomeTeam", "sAwayTeam"],
    cupdb: ["sName as Cup"],
  };
  let result = await event(eventTypes, selects, wheres);
  return createTable(
    [
      { header: "Record", sql: "c" },
      { header: "Player", colspan: 2, custom: cupPlayerHeader },
      { header: "Match", colspan: 2, custom: cupMatchHeader },
    ],
    result,
    false,
    title
  );
}
async function event(eventTypes, selects, wheres) {
  let newWheres = {
    matchdb: ["bVoided=1"],
    eventdb: [`iType IN (${eventTypes})`],
    cupdb: ["iType <= 3"],
  };

  for (let table in wheres) {
    newWheres[table] = newWheres[table] || [];
    newWheres[table] = newWheres[table].concat(wheres[table]);
  }
  let newSelects = {
    none: ["COUNT(*) AS c"],
  };
  for (let table in selects) {
    newSelects[table] = newSelects[table] || [];
    newSelects[table] = newSelects[table].concat(selects[table]);
  }
  return await sqlGet(
    newSelects,
    selects,
    newWheres,
    [{ none: "COUNT(*) DESC" }, { none: "MAX(dUTCTIME) DESC" }],
    25
  );
}

async function hatTrick(title, num) {
  let sql = await DB.query(`
        SELECT iPlayerID,MatchDB.iMatchID 
        FROM EventDB 
        INNER JOIN MatchDB 
        ON EventDB.iMatchID = MatchDB.iMatchID 
        WHERE iType IN(1,4) 
        GROUP BY iPlayerID,iMatchID 
        HAVING COUNT(*) >= ${num} 
        ORDER BY MAX(dUTCTime) DESC`);
  let a = {};
  for (let row of Object.values(sql)) {
    let g = [];
    let sql2 = await DB.query(
      `
            SELECT dRegTime,dInjTime 
            FROM EventDB 
            WHERE iPlayerID = ? AND iMatchID= ? AND iType IN(1,4) ORDER BY dRegTime,dInjTime`,
      [row["iPlayerID"], row["iMatchID"]]
    );
    for (let row2 of Object.values(sql2)) {
      if (row2["dInjTime"] < 0) row2["dInjTime"] = 0;
      g.push(row2["dRegTime"] * 1 + row2["dInjTime"] * 1);
    }
    let t = g[num - 1] - g[0];
    let i = g[0] + "'";
    for (let j = 1; j < num; j++) {
      i += `, ${g[j]}'`;
    }
    for (let j = 1; j <= g.length - num; j++) {
      if (g[j + (num - 1)] - g[j] < t) {
        t = g[j + (num - 1)] - g[j];
        i = g[j] + "'";
        for (let k = j + 1; k < num + j; k++) {
          i += `, ${g[k]}'`;
        }
      }
    }
    if (t > 0) {
      if (a[t] == undefined) a[t] = [];
      a[t].push([row["iPlayerID"], row["iMatchID"], i]);
    }
  }
  ksort(a);
  let i = 0;
  let text = `<table>
		<tr><th colspan=5 >${title}</th></tr>
		<tr><th>Min</th><th colspan=2 >Player</th><th colspan=2 >Match</th></tr>`;
  mainloop: for (let t in a) {
    let r = a[t];
    for (let re of r) {
      i++;
      let playerDB = await DB.query(
        `
                    SELECT sName,sTeam 
                    FROM PlayerDB 
                    WHERE iPlayerID=?`,
        [re[0]]
      );
      let matchDB = await DB.query(
        `
                    SELECT sName,sRound,sHomeTeam,sAwayTeam 
                    FROM MatchDB 
                    INNER JOIN CupDB 
                    ON MatchDB.iCupID = CupDB.iCupID 
                    WHERE MatchDB.iMatchID=?`,
        [re[1]]
      );
      text += `<tr>
                    <td>${t} (${re[2]})</td>
                    <td>${teamLink(playerDB[0]["sTeam"])}</td>
                    <td>${playerDB[0]["sName"]}</td>
                    <td>${matchDB[0]["sName"]} ${matchDB[0]["sRound"]}</td>
                    </tr>`;
      if (i == 25) break mainloop;
    }
  }

  text += "</table>";
  return text;
}

async function teamPerfStat(title, stat, dir) {
  let sql = await DB.query(`
		SELECT 
			AVG(${stat}) AS 'count'
			, sTeam
			,MIN(sSeason) as 'sSeason'
			,MIN(CupDB.sName) as 'Cup'
			,MIN(sHomeTeam) as 'sHomeTeam'
			,MIN(sAwayTeam) as 'sAwayTeam'
			,MIN(sRound) as 'sRound' 
		FROM PerformanceDB 
		INNER JOIN MatchDB ON PerformanceDB.iMatchID=MatchDB.iMatchID 
		INNER JOIN PlayerDB ON PerformanceDB.iPlayerID = PlayerDB.iPlayerID 
		INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iCupID 
		WHERE bVoided = 1 AND ${stat} > 0 AND CupDB.iType <= 3
		GROUP BY iMatchID, sTeam  
		HAVING COUNT(*) > 11 
		ORDER BY AVG(${stat}) ${dir}
		LIMIT 25`);
  let text = `<table>
		<tr><th colspan=4>${title}</th></tr>
		<tr>
			<th>#</th><th colspan=2>Match</th>
		</tr>`;
  for (let row of Object.values(sql)) {
    text += `<tr>
    <td>${Math.round(row["count"] * 100) / 100}</td>
    <td>${teamLink(row.team)}</td>
    <td>${row["Cup"]} ${row["sRound"]}</td><td>${teamLink(
      row["sHomeTeam"]
    )} - ${teamLink(row["sAwayTeam"])}</td>
            </tr>`;
  }
  text += "</table>";
  return text;
}

async function dayEvent(title, where, order) {
  let sql = await DB.query(`
	SELECT 
		MIN(CupDB.sName) AS 'Cup', MIN(iCupID) AS 'iCupID', COUNT(DISTINCT(MatchDB.iMatchID)) AS 'c2',${where} AS 'c',DATE(dUTCTime) AS 'dDate'
	FROM 
		MatchDB
		INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iCupID
		LEFT JOIN EventDB ON MatchDB.iMatchID = EventDB.iMatchID
	WHERE 
		bVoided = 1
		AND CupDB.iType <= 3
		AND sWinningTeam <> ''
	GROUP BY 
		DATE(dUTCTime)
	ORDER BY
		${where} / COUNT(DISTINCT(MatchDB.iMatchID)) ${order}, DATE(dUTCTime) DESC
	LIMIT
		25`);
  let text = `<table>
		<tr><th colspan=3>${title}</th></tr>
		<tr>
			<th>Per</th><th>Total</th><th>Day</th>
		</tr>`;
  for (let row of Object.values(sql)) {
    let sql2 = await DB.query(
      `SELECT DATE(dUTCTime) AS 'dDate' FROM MatchDB WHERE iCupID=${row["iCupID"]} GROUP BY DATE(dUTCTime) ORDER BY DATE(dUTCTime)`
    );
    let i = 1;
    for (let row2 of Object.values(sql2)) {
      if (row2["dDate"] == row["dDate"]) break;
      i++;
    }
    text += `<tr><td>${Math.round((row["c"] / row["c2"]) * 100) / 100}</td>
    <td>${row["c"]}</td>
    <td>${row["Cup"]} Day ${i}</td></tr>`;
  }
  text += "</table>";
  return text;
}

async function dayMatchStat(title, where, stat, order) {
  let sql = await DB.query(`
	SELECT 
		DATE(dUTCTime) AS 'dDate', iCupID, MIN(CupDB.sName) AS 'Cup', ${stat} AS 'c',COUNT(*) AS 'c2'
	FROM 
		MatchStatDB INNER JOIN MatchDB ON MatchDB.iMatchID = MatchStatDB.iMatchID
		INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iCupID
	WHERE 
		${where}
	GROUP BY 
		DATE(dUTCTime), iCupID
	ORDER BY
		${stat}/COUNT(*) ${order}, DATE(dUTCTime) DESC
	LIMIT
		25`);
  let text = `<table>
		<tr><th colspan=4>${title}</th></tr>
		<tr>
			<th>Per</th><th>Total</th><th>Day</th>
		</tr>`;
  for (let row of Object.values(sql)) {
    let sql2 = await DB.query(
      `SELECT DATE(dUTCTime) AS 'dDate' FROM MatchDB WHERE iCupID=${row["iCupID"]} GROUP BY DATE(dUTCTime) ORDER BY DATE(dUTCTime)`
    );
    let i = 1;
    for (let row2 of Object.values(sql2)) {
      if (row2["dDate"] == row["dDate"]) break;
      i++;
    }
    text += `<tr><td>${Math.round((row["c"] / row["c2"]) * 100) / 100}</td>
    <td>${row["c"]}</td>
    <td>${row["Cup"]} Day ${i}</td></tr>`;
  }
  text += "</table>";
  return text;
}
