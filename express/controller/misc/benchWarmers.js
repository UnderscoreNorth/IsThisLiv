import DB from '../../lib/db.js';
import * as h from '../../lib/helper.js';
import fs from 'fs/promises';
class model {
    static main = async(req, res, next) =>{
        let result = {};
        let html = `<h2>Bench Warmers</h2>
        Players that never got to spend time on the pitch
        <br>Bold indicates that this was also the player's first cup<br><br>`;
	    let cup = "";
        html += `<div class='subContainer' style='width:7rem;'>
            <h3 style='margin:0;padding:1px;'>Jump To</h3>`;
	    let e = "";
	    let link = [];
        let sql = await DB.query("SELECT PlayerDB.sName AS 'Player',CupDB.sName AS 'Cup',sTeam,sRegPos,iLink FROM PlayerDB INNER JOIN CupDB ON PlayerDB.iCupID = CupDB.iID WHERE PlayerDB.iID NOT IN (SELECT DISTINCT(iPlayerID) FROM PerformanceDB) AND PlayerDB.iID NOT IN(SELECT DISTINCT(iPlayerID) FROM EventDB) AND iType <= 3 AND iLink >= 0 ORDER BY dStart DESC, sTeam,PlayerDB.sName");
        for(let i in sql){
            let row = sql[i];
            let player = "";
            if(cup != row.Cup){
                html += `<a href='#${h.cupShort(row.Cup)}'>${h.cupShort(row.Cup)}</a><br>`
                e += `<tr id='${h.cupShort(row.Cup)}' >
                    <th colspan=3>${row.Cup}</th>
                </tr>`;
            }
			cup = row.Cup;
            let boldCheck = await DB.query(`SELECT CupDB.sName 
            FROM CupDB INNER JOIN PlayerDB ON CupDB.iID = PlayerDB.iCupID 
            WHERE iLink=? ORDER BY dStart`,[row.iLink]);
            if(boldCheck[0].sName == row.Cup){
                player = "<td style='font-weight:bold'>";
            } else {
                player = "<td>";
            }
            player += `${await h.playerLink([row.iLink,row.Player])}</td>`;
            e += `<tr><td>${h.teamLink(row.sTeam)}</td><td>${row.sRegPos}</td>${player}</tr>`;
            
            if(typeof link[row.iLink] == 'undefined')
			    link[row.iLink] = `<td>${h.teamLink(row.sTeam)}</td><td>${await h.playerLink([row.iLink,row.Player])}</td>`;
		}
        html += "</div><div class='subContainer'><table>";
        html += e;
        html += "</table></div><div class='subContainer'><table><tr><th>Matches</th><th>Played</th><th>Team</th><th>Player</th></tr>";
        let bench = {};
        for(let pID in link){
            let pInf = link[pID];
            sql = await DB.query(`SELECT DISTINCT(MatchDB.iID) AS 'ID' FROM MatchDB INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iID INNER JOIN PlayerDB ON PlayerDB.iCupID = CupDB.iID WHERE iLink = ? AND iType <= 3 AND (sHomeTeam = PlayerDB.sTeam OR sAwayTeam = PlayerDB.sTeam)`,[pID]);        
            let mID = [];
            let c = 0;
            for(let i in sql){
                let row = sql[i];
                mID.push(row.ID);
                c++;
            }
            sql = await DB.query(`SELECT COUNT(*) AS 'c' FROM PerformanceDB INNER JOIN PlayerDB ON PerformanceDB.iPlayerID = PlayerDB.iID WHERE iLink = ${pID} AND iMatchID IN (${mID.join(',')})`);
            let p = sql[0].c;
            if(typeof bench[p] == 'undefined'){
                bench[p] = [];
            }
            if(p/c < 0.5)
                bench[p].push([c,`<tr><td>${c}</td><td>${p}</td>${pInf}</tr>`]);
        }
        bench = h.ksort(bench);
        for(let i in bench){
            let list = h.arsort(Object.assign({},bench[i]));
            for(let player of list){
                html += player[1][1];
            }
        }
        html += `</table></div>
        <STYLE>
            td{
                text-align:left;
            }
            .subContainer{
                display: inline-block;
                vertical-align: top;
                height: calc(100% - 11rem);
                overflow-y: scroll;
                background: rgba(0,0,0,0.1);
                margin: 1rem;
                padding: 1rem;
                border:solid 1px grey;
                margin-bottom:0;
            }
            table{
                border:none!important;
                background:none!important;
            }
        </STYLE>`;
        result.html = html;
        result.date = new Date().toLocaleString('en-us',{timeStyle:'short',dateStyle:'medium'});
        await fs.writeFile(req.staticUrl,JSON.stringify(result));
        res.send(result);     
    }
}                                 
export {model as default};