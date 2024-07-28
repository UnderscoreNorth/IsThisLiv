import { Request } from "express";
import { getMatches } from "../../../db/commonFn";
import { db } from "../../../db";
import { Cup, Match } from "../../../db/schema";
import { and, desc, eq, InferSelectModel, like, lte } from "drizzle-orm";
import {
  arsort,
  cupLink,
  keySort,
  krsort,
  teamLink,
} from "../../../lib/helper";

export async function groupStageResults(req: Request) {
  let html = `<style>img{max-height:80px}</style><h2>Group Stage Results</h2>`;
  let matches = await db
    .select()
    .from(Match)
    .innerJoin(Cup, eq(Match.cupID, Cup.cupID))
    .where(and(lte(Cup.cupType, 2), like(Match.round, "Group%")))
    .orderBy(desc(Match.utcTime));
  let groups: Record<
    string,
    {
      cup: InferSelectModel<typeof Cup>;
      group: string;
      teams: Record<string, number>;
      result: string;
    }
  > = {};
  let results: Record<string, { result: string; n: number }> = {};
  for (const { cup, match } of matches) {
    const key = cup.cupID + match.round;
    if (groups[key] == undefined)
      groups[key] = {
        cup,
        group: match.round,
        teams: {},
        result: "",
      };
    if (groups[key].teams[match.homeTeam] == undefined)
      groups[key].teams[match.homeTeam] = 0;
    if (groups[key].teams[match.awayTeam] == undefined)
      groups[key].teams[match.awayTeam] = 0;
    if (match.winningTeam == "draw") {
      groups[key].teams[match.homeTeam] += 1;
      groups[key].teams[match.awayTeam] += 1;
    } else if (match.winningTeam !== "") {
      groups[key].teams[match.winningTeam] += 3;
    }
  }
  for (const group of Object.values(groups)) {
    group.result = Object.values(group.teams)
      .sort((a, b) => a - b)
      .reverse()
      .join("-");
    if (results[group.result] == undefined)
      results[group.result] = { result: group.result, n: 0 };
    results[group.result].n++;
  }
  for (const result of keySort(Object.values(results), "n", true)) {
    html += `<div style='display:inline-block;'>
        <h3>${result.result} (${result.n})</h3>
        <div style='height:80vh;overflow-y:scroll'><table>`;
    for (const group of Object.values(groups)) {
      if (group.result == result.result) {
        html += `<tr><td rowspan=${
          Object.values(group.teams).length
        } ><b>${await cupLink(group.cup, {
          logo: true,
          format: "med",
          text: group.group,
          textPos: "above",
        })}</b></td>`;
        let first = true;
        let teams: Array<{ p: number; t: string }> = [];
        for (let team in group.teams) {
          teams.push({ t: team, p: group.teams[team] });
        }

        for (let team of keySort(teams, "p", true)) {
          if (first) {
            first = false;
          } else {
            html += `<tr>`;
          }
          html += `<td style='text-align:right'>${teamLink(
            team.t,
            "right"
          )}</td><td>${team.p}</td></tr>`;
        }
        html += `<tr><td colspan=3 style='height:1rem' ></td></tr>`;
      }
    }
    html += `</table></div></div>`;
  }
  return { html, date: new Date() };
}

/*
<?php
include("$_SERVER[DOCUMENT_ROOT]/../4ccCreds.php");
echo "<h2>Group Stage Results</h2>";
//echo "Every continuous streak (4+) of cup appearances<br><br>";
$query = "SELECT * FROM MatchDB INNER JOIN CupDB ON MatchDB.iCupID = CupDB.iID WHERE iType <= 2 AND sRound LIKE 'Group%' AND sWinningTeam <> '' ORDER BY iCupID DESC,sRound";
$arr = array();
$sql = $DB->query($query);
$curr = array();
$group = "";
while($row = $sql->fetch_assoc()){
	if($group <> cupShort($row['sName']) . " " . $row['sRound']){
		if($group){
			arsort($curr);
			$t = implode("-",$curr);
			if(!isset($arr[$t]))
				$arr[$t] = array();
			$arr[$t][$group] = $curr;
		}
		$curr = array();
		$group = cupShort($row['sName']) . " " . $row['sRound'];
	}
	$h = $row['sHomeTeam'];
	$a = $row['sAwayTeam'];
	if(!isset($curr[$h]))
		$curr[$h] = 0;
	if(!isset($curr[$a]))
		$curr[$a] = 0;
	if($row['sWinningTeam'] == 'draw'){
		$curr[$h]++;
		$curr[$a]++;
	} elseif($row['sWinningTeam'] == $h){
		$curr[$h] += 3;
	} elseif($row['sWinningTeam'] == $a) {
		$curr[$a] += 3;
	}
}
array_multisort(array_map('count', $arr), SORT_DESC, $arr);
foreach($arr as $t=>$arr2){
	echo "<div class='cont'><h3>$t (" . count($arr2) . ")</h3><br>";
	echo "<table>";
	foreach($arr2 as $g=>$arr3){
		echo "<tr><th rowspan=" . count($arr3) . " >$g</th>";
		$y = substr($g,0,4);
		$s = trim(substr($g,5,3));
		switch($s){
			case "SC":
				$s = "Summer";
				break;
			case "SBC":
				$s = "Spring";
				break;
			case "ABC":
				$s = "Autumn";
				break;
			case "WC":
				$s = "Winter";
				break;
		}
		$cupID = $DB->query("SELECT iID FROM CupDB WHERE iYear = $y AND sSeason='$s' AND iType <=2")->fetch_assoc()['iID'];
		$first = true;
		foreach($arr3 as $team=>$arr4){
			if($first){
				$first = false;
			} else {
				echo "<tr>";
			}
			$c = $DB->query("SELECT COUNT(*) AS 'c' FROM MatchDB WHERE iCupID=$cupID AND (sHomeTeam='$team' OR sAwayTeam = '$team') AND sRound = 'Round of 16'")->fetch_assoc()['c'];
			if($c){
				echo "<td style='background:#ddffdd'>";
			} else {
				echo "<td>";
			}
			echo "/$team/</td><td>$arr4</td></tr>";
		}
	}
	echo "</table></div>";
}
?>
<STYLE>
th{
	vertical-align:top;
}
.cont{
	display:inline-block;
	height:calc(100% - 100px);
	margin:10px;
}
table{
	display:inline-block;
	height:calc(100% - 30px);
	overflow-y:scroll;
}
h3{
	margin: 0;
	margin-top:10px;
}
</STYLE>
*/
