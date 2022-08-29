import DB from '../../lib/db.js';
import * as h from '../../lib/helper.js';
import fs from 'fs/promises';
class model {
    static main = async(req, res, next) =>{
        let result = {};
        let sql = await DB.query("SELECT *, MatchDB.iID AS 'mID',cupDB.iPes AS 'cPes' FROM MatchDB INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iID WHERE bVoided = 1 AND sWinningTeam <> 'draw' AND sRound <> 'Friendly' ORDER BY dUTCTime DESC");
        let winners = {};
        let losers = {};
        let cups = {};
        let versions = {};
        let mdl = 2; //Winning threshold
        let html = `
            <h2>Most Dangerous Lead</h2>
            Times a team lost after being up ${mdl}-0<br><br>
            <table style='display:inline-block;vertical-align:top'>
                <tr>
                    <th>Winning Team</th>
                    <th>Losing Team</th>
                    <th>Date</th>
                    <th>Round</th>
                    <th>Result</th>
                    <th>Lead Lost At</th>
                </tr>
        `;
        for(let i in sql){
            let row = sql[i];
            let team = row.sWinningTeam;
            let losingTeam = "";
            let matchID = row.mID;
            let losingGoals = 0;
            let winningGoals = 0;
            let t2 = 0; 
            let mdlCheck = false;
            let time = "";
            let subSql = await DB.query("SELECT sTeam, iType,dRegTime,dInjTime FROM EventDB INNER JOIN PlayerDB ON EventDB.iPlayerID = PlayerDB.iID WHERE iMatchID = ? AND iType IN (1,3,4) ORDER BY dRegTime, dInjTime",[matchID]);
            for(let j in subSql){
                let subRow = subSql[j];
                //If goal is for the losing team (The team that gets the dangerous lead)
                if((subRow.sTeam == team && subRow.iType == 3) || (subRow.sTeam != team && subRow.iType != 3)){
                    losingGoals++;
                //Else if winning team scored before the losing team had a dangerous lead
                } else if(losingGoals < mdl){
                    break;
                } else if(losingGoals >= mdl){
                    mdlCheck = true;
                    winningGoals++;
                    if(losingGoals < winningGoals && !time){
                        if(subRow.dInjTime >= 0){
                            subRow.dInjTime = '+' + subRow.dInjTime;
                        } else {
                            subRow.dInjTime = '';
                        }
                        time = subRow.dRegTime + subRow.dInjTime;
                    }
                }
            }
            if(mdlCheck){
                losingTeam = (team == row.sHomeTeam ? row.sAwayTeam : row.sHomeTeam);
                html += `
                <tr>
                    <td>${h.teamLink(team)}</td>
                    <td>${h.teamLink(losingTeam)}</td>
                    <td>${h.dateFormat(row.dUTCTime)}</td>
                    <td>${row.sRound}</td>
                    <td>${winningGoals} - ${losingGoals}</td>
                    <td>${time}</td>
                </tr>`;
                let cup = h.cupShort(row.sName);
                if(typeof winners[team] == 'undefined')
                    winners[team] = 0;
                if(typeof losers[losingTeam] == 'undefined')
                    losers[losingTeam] = 0;
                if(typeof cups[cup] == 'undefined')
                    cups[cup] = 0;
                if(typeof versions[row.cPes] == 'undefined')
                    versions[row.cPes] = 0;                        
                winners[team]++;
                losers[losingTeam]++;
                cups[cup]++;
                versions[row.cPes]++;
            }
        }
        html += `</table>`;
        let tables = [
            ['Winning Team',winners,1],
            ['Losing Team',losers,1],
            ['Cup',cups,0],
            ['PES Version',versions,0]
        ]
        for(let row of tables){
            let sortable = [];
            for(let i in row[1]){
                sortable.push([i,row[1][i]]);
            }
            sortable.sort(function(a,b){
                return b[1] - a[1];
            })
            html += `
                <table style='display:inline-block;vertical-align:top'>
                <tr><th>${row[0]}</th><th>#</th></tr>`;
            for(let e of sortable){
                html += `<tr><td>${row[2] ? h.teamLink(e[0]) : e[0]}</td><td>${e[1]}</td></tr>`;
            }
            html += `</table>`;
        }
        html += `
        <STYLE>
            table td{
                text-align:left;
            }
            table{
                margin-right:2rem;
                padding:1rem;
            }
        </STYLE>`;
        result.html = html;
        result.date = new Date().toLocaleString('en-us',{timeStyle:'short',dateStyle:'medium'});
        await fs.writeFile(req.staticUrl,JSON.stringify(result));
        res.send(result);     
    }
}
                                    
                                    
                                    
                                    
                                 
export {model as default};