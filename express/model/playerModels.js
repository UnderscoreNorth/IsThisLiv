import DB from '../lib/db.js';
import * as h from '../lib/helper.js';
import fs from 'fs/promises';
class model {
    static main = async(req, res, next) =>{
        let result = {};
        let html = "";

        let cups = 0;
        let team = "";
        let matches = 0;
        let minutes = 0;
        let avgRating = 0;
        let avgCond = 0;
        let goals = 0;
        let assists = 0;
        let saves = 0;
        let yellows = 0;
        let reds = 0;
        let aliases = [];

        let playerID = req.params.playerID.split('-')[0];
        let playerData = await DB.query("SELECT * FROM PlayerLinkDB WHERE iID=?",[playerID]).then((result)=>{
            return result[0];
        });
        team = playerData.sTeam;

        let playerCupData = await DB.query("SELECT * FROM PlayerDB WHERE iLink=?",[playerID]).then((result)=>{
            return result;
        })
        cups = playerCupData.length;

        let cupList = playerCupData.map(x=>x.iCupID);
        cupList = await DB.query(`SELECT * From CupDB WHERE iID IN (${cupList.join(',')}) ORDER BY dStart`).then((result)=>{
            return result;
        });
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
        for(let cup of cupList){
            let query = `
            SELECT * FROM MatchDB 
            INNER JOIN PerformanceDB ON PerformanceDB.iMatchID = MatchDB.iID
            INNER JOIN PlayerDB ON PerformanceDB.iPlayerID = PlayerDB.iID
            WHERE MatchDB.iCupID = ${cup.iID} AND iLink = ${playerID}
            ORDER BY dUTCTime
            `;
            let sql = await DB.query(query); 
            let matchesPlayed = [];
            let pos = "";
            let medal = "";
            for(let i in sql){
                let row = sql[i];
                if(row.bVoided){
                    matches++;
                }
                pos = row.sRegPos;
                medal = row.sMedal;
                matchesPlayed.push({
                    result: (row.bVoided ?
                        (row.sWinningTeam == 'draw' 
                        ? 'D'
                        : (row.sWinningTeam == team
                            ? 'W'
                            : 'L'))
                        : 'V'),
                    round: row.sRound,
                    date: h.dateFormat(row.dUTCTime,'short'),
                    team: (row.sHomeTeam == team ? row.sAwayTeam : row.sHomeTeam),
                    played: `${row.iSubOn} - ${row.iSubOff}`,
                    cond: row.iCond,
                    rating: row.dRating,
                    events: []
                });
            }
            let matchHtml = '';
            if(matchesPlayed.length){
                for(let i in matchesPlayed){
                    let match = matchesPlayed[i];
                    matchHtml += `<tr>`
                    if(i == 0){
                        matchHtml += `
                        <th rowspan=${matchesPlayed.length}>${h.cupShort(cup.sName)}</th>
                        <th rowspan=${matchesPlayed.length} class=${medal}>${pos}</th>`
                    } 
                    matchHtml += `
                        <td class='${match.result}'>${match.round}</td>
                        <td class='${match.result}'>${match.date}</td>
                        <td class='${match.result}'>${match.team}</td>
                        <td class='${match.result}'>${match.played}</td>
                        <td class='${match.result}'>${match.cond}</td>
                        <td class='${match.result}'>${match.rating}</td>
                        <td class='${match.result}'>${match.events.join('\n')}</td>
                    `
                    matchHtml += `</tr>`;
                }
            } else {
                matchHtml += `
                    <tr>
                    <th>${h.cupShort(cup.sName)}</th>
                    <th class=${medal}>${pos}</th>
                    <td colspan=7 style='text-align:center'>Did not play</td>
                    </tr>`; 
            }
            totalMatchHtml += matchHtml;
        }
        html += totalMatchHtml + `</table>`;
        result.html = html;
        result.date = new Date().toLocaleString('en-us',{timeStyle:'short',dateStyle:'medium'});
        await fs.writeFile(req.staticUrl,JSON.stringify(result));
        res.send(result);
    }
    static search = async(req,res,next)=>{
        let search = '%' + req.body.search + '%';
        let sql = await DB.query(`
            SELECT sPlayer,PlayerDB.sTeam,iLink 
            FROM PlayerLinkDB
            INNER JOIN PlayerDB ON PlayerLinkDB.iID = PlayerDB.iLink 
            WHERE sPlayer LIKE ?
            OR sName LIKE ? 
            GROUP BY sPlayer,PlayerDB.sTeam,iLink
            ORDER BY sPlayer`,[search,search]);
        let result = [];
        for(let i in sql){
            let row = sql[i];
            result.push({
                id:row.iLink,
                team:row.sTeam,
                urlName: row.sPlayer.replace(/./gm, function(s) {return (s.match(/[a-z0-9]+/i)) ? s : "";}),
                name:row.sPlayer});
        }
        res.send(result);
    }
}
export {model as default};