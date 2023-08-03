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
class records {
  static main = async (req, res, next) => {
    let stats = await fs.stat(req.staticUrl).catch((err) => {
      return { mtime: new Date("01/01/2000") };
    });
    let result = {};
    let html = "";
    if (new Date() - stats.mtime > pageExpiry) {
      console.log(req.staticUrl);
      if (req.staticUrl.includes("Match-Individual")) {
        html = `<h2>Match Records</h2>
                <h3>Individual</h3>`;
        html += await event(
          "Most Goals Scored",
          "EventDB.iType IN (1,4) AND bVoided = 1 AND CupDB.iType <= 3"
        );
        html += await event(
          "Most Goals Scored in the First Half",
          "EventDB.iType IN (1,4) AND bVoided = 1 AND CupDB.iType <= 3 AND dRegTime <= 45"
        );
        html += await event(
          "Most Goals Scored in the Second Half",
          "EventDB.iType IN (1,4) AND bVoided = 1 AND CupDB.iType <= 3 AND dRegTime > 45 AND dRegTime <= 90"
        );
        html += await event(
          "Most Goals Scored in Extra Time",
          "EventDB.iType IN (1,4) AND bVoided = 1 AND CupDB.iType <= 3 AND dRegTime > 90"
        );
        html += await event(
          "Most Assists",
          "EventDB.iType IN (2) AND bVoided = 1 AND CupDB.iType <= 3"
        );
        html += await perfInd(
          "Most Saves",
          "bVoided = 1 AND CupDB.iType <= 3 AND iSaves >= 0",
          "SUM(iSaves)"
        );
        html += await perfInd(
          "Highest Rating",
          "bVoided = 1 AND CupDB.iType <= 3 AND dRating > 0",
          "MAX(dRating)"
        );
        html += await hatTrick("Quickest Brace", 2);
        html += await hatTrick("Quickest Hat Trick", 3);
        html += await hatTrick("Quickest Double Brace", 4);
      } else if (req.staticUrl.includes("Match-Team")) {
        html = `<h2>Match Records</h2>
                <h3>Team</h3>`;
        html += await teamMatchStat(
          "Most Shots",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iShots)"
        );
        html += await teamMatchStat(
          "Most Shots on Target",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iShotsOT)"
        );
        html += await teamMatchStat(
          "Most Fouls",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iFouls)"
        );
        html += await teamMatchStat(
          "Most Offsides",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iOffsides)"
        );
        html += await teamMatchStat(
          "Most Free Kicks",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iFreeKicks)"
        );
        html += await teamMatchStat(
          "Most Passes Made (PES18+)",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iPassMade)"
        );
        html += await teamMatchStat(
          "Most Crosses",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iCrosses)"
        );
        html += await teamMatchStat(
          "Most Interceptions",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iInterceptions)"
        );
        html += await teamMatchStat(
          "Most Tackles",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iTackles)"
        );
        html += await teamMatchStat(
          "Most Saves",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1",
          "SUM(iSaves)"
        );
        html += await teamPerfStat("Highest Avg Rating", "dRating", "DESC");
        html += await teamPerfStat("Lowest Avg Rating", "dRating", "ASC");
        html += await teamPerfStat("Highest Avg Condition", "iCond", "DESC");
        html += await teamPerfStat("Lowest Avg Condition", "iCond", "ASC");
        html += await teamMatchStat(
          "Most Shots all on Target",
          "bVoided = 1 AND CupDB.iType <= 3 AND bFinal = 1 AND iShots=iShotsOT",
          "SUM(iShotsOT)"
        );
        html += await event(
          "Most Cards",
          "EventDB.iType IN (5,6,8) AND bVoided = 1 AND CupDB.iType <= 3",
          true
        );
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
      }
      html +=
        "<style>table{margin:2rem;display:inline-block;min-width:40%}</style>";
      result.html = html;
      await fs.writeFile(req.staticUrl, JSON.stringify(result));
    } else {
      result = JSON.parse(await fs.readFile(req.staticUrl));
    }
    res.send(result);
  };
}
export { records as default };

async function attendance() {
  let sql = await DB.query(`
	SELECT 
		sHomeTeam, sAwayTeam, sRound, CupDB.sName AS 'Cup', iAttendence AS 'c'
	FROM 
		MatchDB
		INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iID
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

async function event(title, where, teamFlag = false) {
  let sql = await DB.query(`
	SELECT 
		sHomeTeam, sAwayTeam, sRound, sTeam,CupDB.sName AS 'Cup', COUNT(*) AS 'c'${
      teamFlag ? "" : `, PlayerDB.sName AS 'Player'`
    }
	FROM 
		EventDB INNER JOIN PlayerDB ON EventDB.iPlayerID = PlayerDB.iID
		INNER JOIN MatchDB ON MatchDB.iID = EventDB.iMatchID
		INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iID
	WHERE 
		${where}
	GROUP BY 
		MatchDB.iID${teamFlag ? ",sTeam" : ",PlayerDB.iID"}
	ORDER BY
		COUNT(*) DESC, MatchDB.dUTCTime DESC
	LIMIT
		25`);
  let text = `<table>
		<tr><th colspan=${teamFlag ? 5 : 6}>${title}</th></tr>
		<tr>
			<th>#</th>
      ${teamFlag ? `<th colspan=1>Team</th>` : `<th colspan=2>Player</th>`}
      <th colspan=2>Match</th>
		</tr>`;
  for (let row of Object.values(sql)) {
    text += `<tr><td>${row["c"]}</td>
                <td>${teamLink(row["sTeam"])}</td>
                ${!teamFlag ? `<td>${row["Player"]}</td>` : ""}
                <td>${row["Cup"]} ${row["sRound"]}</td>
                <td>${teamLink(row["sHomeTeam"])} - ${teamLink(
      row["sAwayTeam"]
    )}</td>
                </tr>`;
  }
  text += "</table>";
  return text;
}

async function perfInd(title, where, stat) {
  let sql = await DB.query(`
	SELECT 
		sHomeTeam, sAwayTeam, sRound, sTeam,CupDB.sName AS 'Cup', ${stat} AS 'c', PlayerDB.sName AS 'Player'
	FROM 
		PerformanceDB INNER JOIN PlayerDB ON PerformanceDB.iPlayerID = PlayerDB.iID
		INNER JOIN MatchDB ON MatchDB.iID = PerformanceDB.iMatchID
		INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iID
	WHERE 
		${where}
	GROUP BY 
		PlayerDB.iID,MatchDB.iID
	ORDER BY
		${stat} DESC, MatchDB.dUTCTime DESC
	LIMIT
		25`);
  let text = `<table>
		<tr><th colspan=6>${title}</th></tr>
		<tr>
			<th>#</th><th colspan=2>Player</th><th colspan=2>Match</th>
		</tr>`;
  for (let row of Object.values(sql)) {
    text += `<tr><td>${row["c"]}</td>
            <td>${teamLink(row["sTeam"])}</td>
            <td>${row["Player"]}</td>
            <td>${row["Cup"]} ${row["sRound"]}</td>
            <td>${teamLink(row["sHomeTeam"])} - ${teamLink(
      row["sAwayTeam"]
    )}</td>
            </tr>`;
  }
  text += "</table>";
  return text;
}
async function hatTrick(title, num) {
  let sql = await DB.query(`
        SELECT iPlayerID,iMatchID 
        FROM EventDB 
        INNER JOIN MatchDB 
        ON EventDB.iMatchID = MatchDB.iID 
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
                    WHERE iID=?`,
        [re[0]]
      );
      let matchDB = await DB.query(
        `
                    SELECT sName,sRound,sHomeTeam,sAwayTeam 
                    FROM MatchDB 
                    INNER JOIN CupDB 
                    ON MatchDB.iCupID = CupDB.iID 
                    WHERE MatchDB.iID=?`,
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

async function teamMatchStat(title, where, stat) {
  let sql = await DB.query(`
	SELECT 
		sHomeTeam, sAwayTeam, sRound, CupDB.sName AS 'Cup', ${stat} AS 'c', CASE WHEN bHome = 1 THEN sHomeTeam ELSE sAwayTeam END AS 'team'
	FROM 
		MatchStatDB INNER JOIN MatchDB ON MatchDB.iID = MatchStatDB.iMatchID
		INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iID
	WHERE 
		${where}
	GROUP BY 
		MatchDB.iID,bHome
	ORDER BY
		${stat} DESC, MatchDB.dUTCTime DESC
	LIMIT
		25`);
  let text = `<table>
		<tr><th colspan=4>${title}</th></tr>
		<tr>
			<th>#</th><th colspan=2>Match</th>
		</tr>`;
  for (let row of Object.values(sql)) {
    text += `<tr>
    <td>${row["c"]}</td>
    <td>${teamLink(row.team)}</td>
    <td>${row["Cup"]} ${row["sRound"]}</td><td>${teamLink(
      row["sHomeTeam"]
    )} - ${teamLink(row["sAwayTeam"])}</td>
            </tr>`;
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
		INNER JOIN MatchDB ON PerformanceDB.iMatchID=MatchDB.iID 
		INNER JOIN PlayerDB ON PerformanceDB.iPlayerID = PlayerDB.iID 
		INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iID 
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
		MIN(CupDB.sName) AS 'Cup', MIN(iCupID) AS 'iCupID', COUNT(DISTINCT(MatchDB.iID)) AS 'c2',${where} AS 'c',DATE(dUTCTime) AS 'dDate'
	FROM 
		MatchDB
		INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iID
		LEFT JOIN EventDB ON MatchDB.iID = EventDB.iMatchID
	WHERE 
		bVoided = 1
		AND CupDB.iType <= 3
		AND sWinningTeam <> ''
	GROUP BY 
		DATE(dUTCTime)
	ORDER BY
		${where} / COUNT(DISTINCT(MatchDB.iID)) ${order}, DATE(dUTCTime) DESC
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
		MatchStatDB INNER JOIN MatchDB ON MatchDB.iID = MatchStatDB.iMatchID
		INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iID
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
