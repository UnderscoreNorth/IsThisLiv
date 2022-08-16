import DB from '../lib/db.js';
import {teamLink} from '../lib/links.js';
class model {
    static main = async(req, res, next) =>{
        let teams = await DB.query('SELECT DISTINCT(sHomeTeam) FROM MatchDB WHERE bVoided = 1 ORDER BY sHomeTeam','');
        let wikiText = ``;
        let result = [];
        for(let i in teams){
            let team = teams[i].sHomeTeam;
            let stats = await DB.query(`SELECT SUM(CASE WHEN sWinningTeam = '${team}' THEN 1 ELSE 0 END) AS 'w',SUM(CASE WHEN sWinningTeam = 'draw' THEN 1 ELSE 0 END) AS 'd',SUM(CASE WHEN sWinningTeam <> '${team}' AND sWinningTeam <> 'draw' THEN 1 ELSE 0 END) AS 'l' FROM MatchDB WHERE (sHomeTeam = '${team}' OR sAwayTeam = '${team}') AND bVoided = 1`);
            let goals = await DB.query(`SELECT SUM(CASE WHEN (iType IN(1,4) AND sTeam='${team}') OR (iType = 3 AND sTeam <> '${team}') THEN 1 ELSE 0 END) AS 'gf', SUM(CASE WHEN (iType IN(1,4) AND sTeam<>'${team}') OR (iType = 3 AND sTeam = '${team}') THEN 1 ELSE 0 END) AS 'ga'FROM EventDB INNER JOIN MatchDB ON EventDB.iMatchID = MatchDB.iID INNER JOIN PlayerDB ON PlayerDB.iID = EventDB.iPlayerID WHERE (sHomeTeam = '${team}' OR sAwayTeam = '${team}') AND bVoided = 1`);
            let eCups = await DB.query(`SELECT COUNT(DISTINCT(iCupID)) AS 'c' FROM MatchDB INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iID WHERE (sHomeTeam = '${team}' OR sAwayTeam = '${team}') AND bVoided = 1 AND iType = 1`);
            let bCups = await DB.query(`SELECT COUNT(DISTINCT(CONCAT(iYear,sSeason))) AS 'c' FROM MatchDB INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iID WHERE (sHomeTeam = '${team}' OR sAwayTeam = '${team}') AND bVoided = 1 AND iType IN (2,3)`);
            goals = goals[0];
            stats = stats[0];
            eCups = eCups[0].c;
            bCups = bCups[0].c;
            //wikiText += `{{Fb cl3 team|no-extras=yes|t={{team away|${team}}} |w=` . $stats['w'] . ` |d=` . $stats['d'] . ` |l=` . $stats['l'] . ` |gf=` . $goals['gf'] . ` |ga=` . $goals['ga'] . `}}\n`;
            let n = +stats['w'] + +stats['d'] + +stats['l'];
            let row = [
                teamLink(team),
                eCups,
                bCups,
                (+eCups + +bCups),
                n,
                stats.w,
                stats.d,
                stats.l,
                parseFloat(stats.w/n*100).toFixed(2)+"%",
                stats.w*3 + +stats.d,
                n ? parseFloat((stats.w*3 + +stats.d)/n).toFixed(2) : '-',
                goals.gf,
                n ? parseFloat(goals.gf/n).toFixed(2) : '-',
                goals.ga,
                n ? parseFloat(goals.ga/n).toFixed(2) : '-',
                (goals.gf > goals.ga ? '+' : '') + goals.gf - goals.ga,
                n ? parseFloat((goals.gf - goals.ga)/n).toFixed(2) : '-'
            ];
            result.push(row);
        }
        res.send(result);
    }
}
export {model as default};