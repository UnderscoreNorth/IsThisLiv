import DB from '../lib/db.js';
import {teamLink,pageExpiry,cupLink} from '../lib/helper.js';
import fs from 'fs/promises';
class model {
    static main = async(req, res, next) =>{
        console.log('main model');
        let stats = await fs.stat(req.staticUrl).catch((err)=>{
            return {mtime:new Date('01/01/2000')};
        });
        let result = [];
        if(new Date() - stats.mtime > pageExpiry || 1==1){
            let cups = await DB.query('SELECT * FROM `CupDB` WHERE iType <= 4 ORDER BY dStart DESC','');
            let wikiText = ``;
            
            for(let i in cups){
                let cupID = cups[i].iID
                let cupName = cups[i].sName;
                let cupType = cups[i].iType;
                switch(cupType){
                    case 1: 
                        cupType = 'Elite';
                        break;
                    case 2: 
                        cupType = 'Babby';
                        break;
                    case 3:
                        cupType = 'Qualifier';
                        break;
                    case 4:
                        cupType = 'Friendlies';
                        break;
                }
                let row = [
                    await cupLink(cupID),
                    cupType,
                    new Date(cups[i].dStart).toLocaleDateString() + ' - ' + new Date(cups[i].dEnd).toLocaleDateString()

                ]
                result.push(row);
            }
            await fs.writeFile(req.staticUrl,JSON.stringify(result));
        } else {
            result = JSON.parse(await fs.readFile(req.staticUrl));
        }
        res.send(result);
    }
    static cup = async(req, res, next) =>{
        let result = {};
        let cupID = req.url.split('-')[0].substring(1);
        let teams = [];
        let cupMeta = await DB.query("SELECT * FROM CupDB WHERE iID=?",[cupID]);
        let totalGoals = 0;
        let totalMatches = 0;
        cupMeta = cupMeta[0];
        let sql = await DB.query(`SELECT DISTINCT sHomeTeam FROM MatchDB WHERE iCupID=? ORDER BY sHomeTeam`,[cupID]);
        for(let i in sql){
            let row = sql[i];
            teams.push({name:row.sHomeTeam});
        }
        result.teams = teams;

        sql = await DB.query("SELECT * FROM MatchDB INNER JOIN RoundOrder ON MatchDB.sRound = RoundOrder.sRound WHERE iCupID=? ORDER BY iOrder,RoundOrder.sRound,dUTCTime",[cupID]);
        let matches = {};
        for(let i in sql){
            let row = sql[i];
            let roundType = "";
            totalMatches++;
            switch(row.iOrder){
                case 1:
                case 2:
                case 3:
                    roundType = 'groups';
                    break;
                default:
                    roundType = 'kos';
                    break;
            }
            if(typeof matches[roundType] != 'object')
                matches[roundType] = {};
            if(typeof matches[roundType][row.sRound] != 'object')
                matches[roundType][row.sRound] = {
                    name:row.sRound,
                    matches:[],
                    table:{}};
            let teams = [row.sHomeTeam,row.sAwayTeam];
            for(let team of teams){
                if(typeof matches[roundType][row.sRound].table[team] != 'object')
                    matches[roundType][row.sRound].table[team] = {status:'red',data:[teamLink(team),0,0,0,0,0,0,0,0]};
            }

            let goals = [0,1];
            let players = [{},{}];

            let subSql = await DB.query("SELECT * FROM EventDB INNER JOIN PlayerDB ON EventDB.iPlayerID = PlayerDB.iID WHERE iMatchID=? ORDER BY dRegTime,dInjTime",[row.iID]);
            for(let j in subSql){
                let e = subSql[j];
                let oTeam = e.sTeam;
                let aTeam = e.sTeam != row.sHomeTeam ? row.sHomeTeam : row.sAwayTeam;
                if(e.iType == 1 || e.iType == 4){
                    matches[roundType][row.sRound].table[oTeam].data[5]++;
                    matches[roundType][row.sRound].table[aTeam].data[6]++;
                    totalGoals++;
                    goals[oTeam == row.sHomeTeam ? 0 : 1]++;
                } else if (e.iType == 3){
                    matches[roundType][row.sRound].table[oTeam].data[6]++;
                    matches[roundType][row.sRound].table[aTeam].data[5]++;
                    totalGoals++;
                    goals[oTeam == row.sHomeTeam ? 1 : 0]++;
                }
                matches[roundType][row.sRound].table[oTeam].data[7] = 
                matches[roundType][row.sRound].table[oTeam].data[5] -
                matches[roundType][row.sRound].table[oTeam].data[6];
                matches[roundType][row.sRound].table[aTeam].data[7] = 
                matches[roundType][row.sRound].table[aTeam].data[5] -
                matches[roundType][row.sRound].table[aTeam].data[6];
            }

            
            for(let team of teams){
                matches[roundType][row.sRound].table[team].data[1]++;
                if(row.sWinningTeam == 'draw'){
                    matches[roundType][row.sRound].table[team].data[3]++;
                    matches[roundType][row.sRound].table[team].data[8] ++;
                } else if(row.sWinningTeam == team) {
                    matches[roundType][row.sRound].table[team].data[2]++;
                    matches[roundType][row.sRound].table[team].data[8] += 3;
                } else {
                    matches[roundType][row.sRound].table[team].data[4]++;
                }
            }
                
            matches[roundType][row.sRound].matches.push({ 
                date:new Date(row.dUTCTime).toLocaleDateString(),
                time:new Date(row.dUTCTime).toLocaleTimeString(),
                stadium:row.sStadium,
                attendance:row.iAttendence,
                home:row.sHomeTeam,
                away:row.sAwayTeam,
                homeg: goals[0],
                awayg: goals[1]
            });
        }
        for(let i in matches){
            for(let j in matches[i]){
                matches[i][j].table = Object.values(matches[i][j].table);
                matches[i][j].table = matches[i][j].table.sort((a,b) => {
                    if(b.data[8] == a.data[8]){
                        if(b.data[7] == a.data[7]){
                            if(b.data[5] == a.data[5]) {
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
                })
                matches[i][j].table[0].status = 'green'
                matches[i][j].table[1].status = 'green'
            }
            matches[i] = Object.values(matches[i]);
        }
        result.cupName = cupMeta.sName;
        result.matches = matches;
        result.goals = totalGoals;
        result.numMatches = totalMatches;
        result.gpm = Math.floor((totalMatches ? totalGoals / totalMatches : 0)*100)/100;
        res.send(result);
    }
}
export {model as default};