import { Request } from "express";
import { db } from "../../db";
import {
  Cup,
  Fantasy,
  FantasyPlayer,
  Player,
  RosterOrder,
} from "../../db/schema";
import { desc, eq } from "drizzle-orm";
import { playerLink } from "../../lib/helper";

export default async function mainWiki(req: Request) {
  const cupID = req.body.cupID;
  if (!(cupID > 0)) return { error: "Bad Cup ID" };
  const cup = (await db.select().from(Cup).where(eq(Cup.cupID, cupID)))[0];
  const teams = await db.select().from(Fantasy).where(eq(Fantasy.cupID, cupID));
  let teamText = "";
  let data: {
    team: string;
    group: any;
    ko: any;
    points: {
      r1: number;
      r2: number;
      r3: number;
      r4: number;
      ro16: number;
      qf: number;
      sf: number;
      fn: number;
      tot: number;
    };
  }[] = [];
  for (const team of teams) {
    const players = await db
      .select()
      .from(FantasyPlayer)
      .innerJoin(Player, eq(FantasyPlayer.playerID, Player.playerID))
      .innerJoin(RosterOrder, eq(Player.regPos, RosterOrder.pos))
      .where(eq(FantasyPlayer.teamID, team.teamID))
      .orderBy(
        FantasyPlayer.stage,
        desc(FantasyPlayer.start),
        RosterOrder.order
      );
    const teamData = {
      team: team.name,
      group: { start: [], bench: [] },
      ko: { start: [], bench: [] },
      points: {
        r1: 0,
        r2: 0,
        r3: 0,
        r4: 0,
        ro16: 0,
        qf: 0,
        sf: 0,
        fn: 0,
        tot: 0,
      },
    };
    teamText += `
<div class='toccolours mw-collapsible mw-collapsed'>
'''<nowiki>${team.name}</nowiki>'''
    <div class='mw-collapsible-content'>
        {{sq ffg start}}`;
    for (let p in players) {
      const i = parseInt(p);
      const { player, fantasyp } = players[i];
      const round = fantasyp.stage === 1 ? "ko" : "group";
      const start = fantasyp.start === 1 ? "start" : "bench";
      const t = i < 17 ? "g" : "k";
      if (i == 11 || i == 28)
        teamText += `
        {{sq ff${t} mid}}`;
      if (i == 17)
        teamText += `
     {{sq ffk start}}`;
      teamText += `
    	{{sq ff${t} `;
      teamText += player.medal.toLowerCase();
      if (player.medal.length == 0 && fantasyp.start == 1) teamText += "start";
      teamText += ` player |team=${player.team} |pos=${player.regPos} |name=${player.name} `;
      if (fantasyp.cap == 2) teamText += "{{captain}} ";
      if (fantasyp.cap == 1) teamText += "{{vice-captain}} ";
      teamText += `|g1=${fantasyp.r1 ?? "-"} |g2=${fantasyp.r2 ?? "-"} |g3=${
        fantasyp.r3 ?? "-"
      } |g4=${fantasyp.r4 ?? "-"} |rs=${fantasyp.ro16 ?? "-"} |qs=${
        fantasyp.qf ?? "-"
      } |ss=${fantasyp.sf ?? "-"} |fs=${fantasyp.fn ?? "-"} |ts=${
        fantasyp.tot ?? "-"
      } }}`;
      for (let key in teamData.points) {
        teamData.points[key] += fantasyp[key];
      }
    }
    teamText += `
        {{sq ffk end}}
    </div>
</div>`;
    data.push(teamData);
  }
  let sortedData = structuredClone(data);
  sortedData.sort((a, b) => {
    if (a.points.tot > b.points.tot) return -1;
    if (a.points.tot < b.points.tot) return 1;
    return 0;
  });
  return {
    wiki: `[[${cup.cupName.replace(
      /\s/gi,
      "_"
    )}_Fantasy_Football/Data|Individual Player Scores]]
==Teams==
${teamText}

==Rankings==
{|  border-radius: 10px; -moz-border-radius: 10px; -webkit-border-radius: 10px; -khtml-border-radius: 10px; -icab-border-radius: 10px; -o-border-radius: 10px;' 
| 
{|  class='wikitable sortable' style='font-size: 90%; background: transparent;' 
|- 
!  style='background-color:#cdcdcd;' |  Team
!  style='background-color:#cdcdcd;width:60px' |  R1
!  style='background-color:#cdcdcd;width:60px' |  R2
!  style='background-color:#cdcdcd;width:60px' |  R3
!  style='background-color:#cdcdcd;width:60px' |  R4
!  style='background-color:#cdcdcd;width:60px' |  Ro16
!  style='background-color:#cdcdcd;width:60px' |  QF
!  style='background-color:#cdcdcd;width:60px' |  SF
!  style='background-color:#cdcdcd;width:60px' |  3rd/Finals
!  style='background-color:#cdcdcd;width:60px' |  Total
${sortedData
  .map((x) => {
    return `|-
| align='left' | <nowiki>${x.team}</nowiki> ${Object.values(x.points)
      .map((x) => {
        return `
| ${x}`;
      })
      .join("")} 
`;
  })
  .join("")}
|}
|}

==Rules==
Teams are to be put on the wiki before the scheduled starting time of the first match of the tournament. This team will count for the whole tournament.<br>

Teams must consist of: a team name, eleven starting players and six substitutes, a captain and a vice-captain. The eleven starting players must follow these guidelines:<br>

*1 goalkeeper
*3-5 defenders, with a maximum of 1 LB and 1 RB. CBs are limitless
*3-6 midfielders, with a maximum of 1 LMF, 1 RMF, 3 AMFs, 3 CMFs, 3 DMFs, and at least one CMF or DMF.
*1-3 forwards, with a maximum of 1 LWF and 1 RWF. CFs and SSs are limitless<br>

The substitutes must consist of one goalkeeper, two defenders, two midfielders and one forward. <br>

A team must have exactly two gold and two silver players. Additionally, the team will get a medal substitute, who can be either gold or silver without affecting these limitations - however, a medal substitute cannot fill in for a lower class, so a gold player substitute cannot fill in for a silver nor can golds or silvers fill in for non-medals. Furthermore, a team may have no more than three players overall from any one board.<br>

If a player in the team's starting eleven does not play in a round, a substitute who does may take their spot. The player must be from the same category, but specific position differences are allowed (so a CB may fill in for a LB, but not for a DMF).<br>

For each round of matches, all players who take the field will receive a score for their performance. The team's score will be calculated at the end of each round as the sum of the scores of their eleven players. If a player does not play and is not covered by a substitute, they will count 0 towards the team's score.<br>

Following the group stages of a cup, teams are allowed to remove eliminated players and replace them with players still in the tournament. The team must run the same formation but can change the individual positions (so a CB may swap for an RB if it does not break the maximums listen above). Medals must remain in the same section of defence, midfield or attack but can change positions. If there are no more players at a level, you are permitted to move the player up or down to the nearest available spot to replace the player. For instance, if you have a gold CB in the team and that was the only team with a gold CB, you then look to teams with a gold DMF then CMF, LMF/RMF, AMF, SS, LWF/RWF, CF in that order. The reverse can be used for non medal strikers. Captains and vice captains can change at this stage.<br>

===Scoring===
Points are accumulated as follows:<br>

*1 point for each full point of match rating in excess of 4, this gets a multiplier for the following positions: GK/CB/FB/DMF - 3x, CMF/WMF - 2x.
*6 points for a defender or goalkeeper scoring a goal. 
*5 points for a midfielder scoring a goal.
*4 points for a forward scoring a goal.
*3 points for a goal assist. 
*4 points for a defender or goalkeeper if their team managed a clean sheet and they played 60 minutes or more.
*3 points for a defender or goalkeeper if their team managed a clean sheet and they took the field yet played less than 60 minutes.
*1 point for a midfielder if their team managed a clean sheet and they played 60 minutes or more.
*1 point for every 2 saves made by a goalkeeper.
*5 points for a goalkeeper saving a penalty (not if it is missed).
*-2 points for a player who misses a penalty.
*3 points if a player is judged Man of the Match by PES.
*2 points if the player's match rating is equal to or higher than the Man of the Match's.
*1 point if the player's match rating is 0.5 less than the Man of the Match's.
*-1 point for every 2 goals conceded by a defender or goalkeeper's team while the player was on the field.
*-1 point for the player receiving a yellow card.
*-3 points for the player receiving a red card.
*-5 points for the player receiving a red card from 2 yellow cards.
*-2 points for the player scoring an own goal.<br>

After these scores are tallied, the captain will have his score doubled, and if he did not play then the vice-captain's score will be doubled instead.<br>

Once scores have been calculated for each match day, they will be posted. The competition will run for the duration of the cup. At the conclusion of the tournament, the team with the highest score will be awarded the Hatte Saburo trophy.

[[Category:${cup.cupName.replace(/\s/gi, "_")}]]
`,
  };
}
