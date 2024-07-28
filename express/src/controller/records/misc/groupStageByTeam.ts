import { Request } from "express";
import { db } from "../../../db";
import { Cup, Match, Team } from "../../../db/schema";
import { and, eq, like, lte, or } from "drizzle-orm";
import { teamLink } from "../../../lib/helper";

export async function groupStageByTeam(req: Request) {
  let html = `<style>
		td{padding:5px}
        .a{cursor:pointer}
	</style>
<h2>Group Stage Results By Team</h2>Click on the headers to sort
	<br><br><table id='tbl'><tr><th></th><th colspan=9>4 Team Groups</th><th></th><th colspan=12>5 Team Groups</th></tr><tr>
	<th class='a' onclick='${sort(0)}'>Team</th>
	<th class='a' onclick='${sort(1)}'>0</th>
	<th class='a' onclick='${sort(2)}'>1</th>
	<th class='a' onclick='${sort(3)}'>2</th>
	<th class='a' onclick='${sort(4)}'>3</th>
	<th class='a' onclick='${sort(5)}'>4</th>
	<th class='a' onclick='${sort(6)}'>5</th>
	<th class='a' onclick='${sort(7)}'>6</th>
	<th class='a' onclick='${sort(8)}'>7</th>
	<th class='a' onclick='${sort(9)}'>9</th>
	<th></th>
	<th class='a' onclick='${sort(11)}'>0</th>
	<th class='a' onclick='${sort(12)}'>1</th>
	<th class='a' onclick='${sort(13)}'>2</th>
	<th class='a' onclick='${sort(14)}'>3</th>
	<th class='a' onclick='${sort(15)}'>4</th>
	<th class='a' onclick='${sort(16)}'>5</th>
	<th class='a' onclick='${sort(17)}'>6</th>
	<th class='a' onclick='${sort(18)}'>7</th>
	<th class='a' onclick='${sort(19)}}'>8</th>
	<th class='a' onclick='${sort(20)}'>9</th>
	<th class='a' onclick='${sort(21)}'>10</th>
	<th class='a' onclick='${sort(22)}'>12</th>
	</tr>`;
  const teams = await db.select().from(Team);
  for (const { team } of teams) {
    const matches = await db
      .select()
      .from(Match)
      .innerJoin(Cup, eq(Match.cupID, Cup.cupID))
      .where(
        and(
          or(eq(Match.homeTeam, team), eq(Match.awayTeam, team)),
          lte(Cup.cupType, 2),
          like(Match.round, "Group%")
        )
      );
    let cups: Record<number, Array<number>> = {};
    for (const { match } of matches) {
      if (cups[match.cupID] == undefined) cups[match.cupID] = [];
      let points = 0;
      if (match.winningTeam == team) points = 3;
      if (match.winningTeam == "draw") points = 1;
      cups[match.cupID].push(points);
    }
    html += `<tr><td style='text-align:right' >${teamLink(team, "right")}</td>`;
    for (let p = 0; p <= 9; p++) {
      if (p == 8) continue;
      let n = 0;
      for (const cup of Object.values(cups)) {
        if (cup.length == 3 && cup.reduce((a, b) => a + b, 0) == p) n++;
      }
      html += `<td>${n}</td>`;
    }
    html += `<td></td>`;
    for (let p = 0; p <= 12; p++) {
      if (p == 11) continue;
      let n = 0;
      for (const cup of Object.values(cups)) {
        if (cup.length == 4 && cup.reduce((a, b) => a + b, 0) == p) n++;
      }
      html += `<td>${n}</td>`;
    }
    html += `</tr>`;
  }
  html += `</table>`;
  return { html, date: new Date() };
}
function sort(n: number) {
  return `
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount,secondSort = 0;
	table = document.getElementById("tbl");
	switching = true;
	secondSort = false;
	if(${n} == 0){
		dir = "asc";
	} else {
		dir = "desc";
	}
	while (switching) {
		switching = false;
		rows = table.rows;
		for (i = 2; i <= (rows.length); i++) {
			shouldSwitch = false;
			x = rows[i].getElementsByTagName("td")[${n}];
			y = rows[i + 1].getElementsByTagName("td")[${n}];
			if(${n}==0){
				if (dir == "asc") {
					if (x.textContent.toLowerCase() > y.textContent.toLowerCase()) {
						shouldSwitch = true;
						break;
					}
				} else if (dir == "desc") {
					if (x.textContent.toLowerCase() < y.textContent.toLowerCase()) {
						shouldSwitch = true;
						break;
					}
				}
			} else {
				if (dir == "asc") {
					if (parseFloat(x.innerHTML) > parseFloat(y.innerHTML)) {
						shouldSwitch = true;
						break;
					}
				} else if (dir == "desc") {
					if (parseFloat(x.innerHTML) < parseFloat(y.innerHTML)) {
						shouldSwitch = true;
						break;
					}
				}
			}
		}
		if (shouldSwitch) {
			rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
			switching = true;
			switchcount ++;
		} else {
			if (switchcount == 0 && dir == "asc") {
				dir = "desc";
				switching = true;
			} else if (switchcount == 0 && dir == "desc"){
				dir = "asc";
				switching = true;
			} 
		}
	}`;
}
