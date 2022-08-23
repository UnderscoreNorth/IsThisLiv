import DB from '../../lib/db.js';
import {teamLink,pageExpiry,cupLink} from '../../lib/helper.js';
import fs from 'fs/promises';
class model {
    static main = async(req, res, next) =>{
        let stats = await fs.stat(req.staticUrl).catch((err)=>{
            return {mtime:new Date('01/01/2000')};
        });
        let result = {};
        if(new Date() - stats.mtime > pageExpiry || 1==1){
            let html = "<h2>Repeat Groups</h2><p>Groups sharing at least 3 teams<br>Green teams promoted</p><table>";
            let sql = await DB.query("SELECT sHomeTeam,iCupID,sRound FROM MatchDB WHERE sROUND LIKE 'Group%' GROUP BY iCupID,sRound,sHomeTeam ORDER BY sRound,MAX(dUTCTime) DESC,sHomeTeam");
            let oldGroup = "";
            let oldCup = "";
            let cups = [];
            let teams = [];
            for(let i in sql){
                let group = sql[i].sRound;
                let cup = sql[i].iCupID;
                if((group != oldGroup || cup != oldCup) && teams.length){
                    cups.push({cup:oldCup,group:oldGroup,teams:teams});
                    teams = [];
                }
                teams.push(sql[i].sHomeTeam);
                oldGroup = group;
                oldCup = cup;
            }
            cups.push({cup:oldCup,group:oldGroup,teams:teams});
            for(let new_row of cups){
                for(let old_row of cups){
                    if(new_row.cup > old_row.cup){
                        let sameTeams = [];
                        for(let team of old_row.teams){
                            if(new_row.teams.includes(team))
                                sameTeams.push(team);
                        }
                        if(sameTeams.length >= 3){
                            let newTeam = [...sameTeams];
                            let oldTeam = [...sameTeams];
                            for(let team of new_row.teams){
                                if(!newTeam.includes(team))
                                    newTeam.push(team);
                            }
                            for(let team of old_row.teams){
                                if(!oldTeam.includes(team))
                                    oldTeam.push(team);
                            }
                            html += `<tr><td>${await cupLink(new_row.cup)}</td><td>${new_row.group}</td>`;
                            for(let team of newTeam){
                                sql = await DB.query(`SELECT COUNT(*) AS 'c' FROM MatchDB WHERE iCupID=? AND (sRound = 'Round of 16' OR sRound = 'Round of 32') AND (sHomeTeam=? OR sAwayTeam=?)`,[new_row.cup,team,team]);
                                if(sql[0].c){
                                    html += `<td class='status-win'>${teamLink(team)}</td>`;
                                } else {
                                    html += `<td>${teamLink(team)}</td>`;
                                }
                            }
                            html += `</tr><tr><td>${await cupLink(old_row.cup)}</td><td>${old_row.group}</td>`;
                            for(let team of oldTeam){
                                sql = await DB.query(`SELECT COUNT(*) AS 'c' FROM MatchDB WHERE iCupID=? AND (sRound = 'Round of 16' OR sRound = 'Round of 32') AND (sHomeTeam=? OR sAwayTeam=?)`,[old_row.cup,team,team]);
                                if(sql[0].c){
                                    html += `<td class='status-win'>${teamLink(team)}</td>`;
                                } else {
                                    html += `<td>${teamLink(team)}</td>`;
                                }
                            }
                            html += "</tr><tr><td colspan=7><div style='min-height:1rem;background:black;margin-right:-0.5rem'></div></td></tr>";
                        }
                    }
                }
            }
            html += "</table><STYLE>td{text-align:left}</STYLE>";
            result.html = html;
            await fs.writeFile(req.staticUrl,JSON.stringify(result));
        } else {
            result = JSON.parse(await fs.readFile(req.staticUrl));
        }
        res.send(result);     
    }
}
                                    
                                    
                                    
                                    
                                 
export {model as default};