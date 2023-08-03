import DB from '../../lib/db.js';
import * as h from '../../lib/helper.js';
import fs from 'fs/promises';
class model {
    static main = async(req, res, next) =>{
        let result = {};
        /*let sql = await DB.query("SELECT PlayerDB.* FROM PlayerDB INNER JOIN CupDB ON PlayerDB.iCupID = CupDB.iID WHERE sMedal <> '' AND iType <= 3");
        let arr = {};
        for(let i in sql){
            let row = sql[i];
            let pID = row.iID;
            let cID = row.iCupID;
            let team = row.sTeam;
            let subSql = await DB.query("SELECT * FROM MatchDB WHERE (sHomeTeam = ? OR sAwayTeam = ?) AND iCupID = ? AND bVoided = 1 AND sWinningTeam <> ''",[team,team,cID]);
            for(let j in subSql){
                let subRow = subSql[j];
                let dnp = 0;
                let perf = await DB.query("SELECT COUNT(*) AS 'c' FROM PerformanceDB WHERE iMatchID = ? AND iPlayerID = ? AND iSubOn = 0 AND iSubOff IN (90,120)",[subRow.iID,pID]).then((result)=>{
                    return result[0].c;
                });
                if(perf == 0){
                    dnp = "Benched";
                    if(perf = $DB->query("SELECT COUNT(*) AS 'c' FROM PerformanceDB WHERE iMatchID = " . $row2['iID'] . " AND iPlayerID = $pID")->fetch_assoc()['c']){
                        $event = $DB->query("SELECT * FROM EventDB WHERE iMatchID=" . $row2['iID'] . " AND iPlayerID = $pID AND iType IN (6,7,8)");
                        while($row3 = $event->fetch_assoc()){
                            switch($row3['iType']){
                                case 6:
                                case 8:
                                    $dnp = "Carded off";
                                    break;
                                case 7:
                                    $dnp = "Killed off";
                                    break;
                                default:
                                    break;
                            }
                            $dnp .= " at " . $row3['dRegTime'];
                        }
                        if($dnp == "Benched"){
                        $dnp = "Subbed off at " . $DB->query("SELECT iSubOff AS 'c' FROM PerformanceDB WHERE iMatchID = " . $row2['iID'] . " AND iPlayerID = $pID ")->fetch_assoc()['c'];
                        }
                    }
                }
                
                if($dnp){
                    $arr[strtotime($row2['dUTCTime'])] = array(
                    $row['sName'],
                    $row['iLink'],
                    $team,
                    $row2['sHomeTeam'],
                    $row2['sAwayTeam'],
                    $row2['sRound'],
                    $row2['sWinningTeam'],
                    matchGoals($row2['sHomeTeam'],$row2['iID']),
                    matchGoals($row2['sAwayTeam'],$row2['iID']),
                    $dnp,
                    $row['sMedal'],
                    $row['sRegPos']
                    );
                }
            }
        }
        krsort($arr);
        foreach($arr as $time=>$row){
            $d .= "<tr style='background:#";
            switch($row[6]){
                case $row[2]:
                    $d .= "ddffdd";
                    break;
                case "draw":
                    $d .= "ffffdd";
                    break;
                default:
                    $d .= "ffdddd";
                    break;
            }
            $d .= "' ><td>" . playerLink($row[1],$row[0]) . "</td><td>" . $row['10'] . " " . $row['11'] . "</td><td>" . teamLink($row[2]) . "</td><td>" . $row[9] . "</td><td>" . 
            date('o-m-d',$time) . " " . $row[5] . "</td><td>" . teamLink($row[3]) . "</td><td>" . $row[7] . "-" . $row[8] . "</td><td>" . teamLink($row[4]) . "</td></tr>";
        }*/
        result.html = html;
        result.date = new Date().toLocaleString('en-us',{timeStyle:'short',dateStyle:'medium'});
        await fs.writeFile(req.staticUrl,JSON.stringify(result));
        res.send(result);     
    }
}                                 
export {model as default};