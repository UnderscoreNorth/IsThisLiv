<script lang='ts'>
	import TeamIcon from "$lib/teamIcon.svelte";
import TeamLink from "$lib/teamLink.svelte";
	import { A } from "flowbite-svelte";
    export let data;
    let teamObj:Record<string,
    {team:string,
    gRanking:number,
    oRanking:number,
    gGF:number,
    gGA:number,
    pts:number,
    oGF:number,
    oGA:number,
    farthestRound:number,
    roundDetails:{
        gf:number,
        ga:number,
        endPeriod:number
    }}> = {};
    for(const team of data.teams){
        teamObj[team] = {
            team,
            gRanking:0,
            oGA:0,
            oGF:0,
            oRanking:0,
            gGA:0,
            gGF:0,
            pts:0,
            farthestRound:0,
            roundDetails:{
                gf:0,
                ga:0,
                endPeriod:0
            }
        }
    }
    if(data?.matches?.groups?.length){
        for(const group of data.matches.groups){
            for(const match of group.matches){
                if(!match.official) continue;
                if(match.winner == 'draw'){
                    teamObj[match.home].pts += 1;
                    teamObj[match.away].pts += 1;
                } else if (match.winner !== ''){
                    teamObj[match.winner].pts += 3;
                } 
                teamObj[match.home].gGF += match.homeg;
                teamObj[match.away].gGF += match.awayg;
                teamObj[match.home].gGA += match.awayg;
                teamObj[match.away].gGA += match.homeg;                
            }
        }
    }
    if(data?.matches?.kos?.length){
        for(let i = 0; i < data.matches.kos.length;i++){
            const group = data.matches.kos[i];
            for(const match of group.matches){
                if(!match.official) continue;
                teamObj[match.home].oGF += match.homeg;
                teamObj[match.away].oGF += match.awayg;
                teamObj[match.home].oGA += match.awayg;
                teamObj[match.away].oGA += match.homeg;
                teamObj[match.home].farthestRound = i +1;
                teamObj[match.away].farthestRound = i +1;
                teamObj[match.home].roundDetails = {
                    gf:match.homeg,
                    ga:match.awayg,
                    endPeriod:match.endPeriod
                }     
                teamObj[match.away].roundDetails = {
                    gf:match.awayg,
                    ga:match.homeg,
                    endPeriod:match.endPeriod
                }            
            }
        }
    }
    let teamArr = Object.values(teamObj);
    teamArr.sort((a,b)=>{
        if(a.pts > b.pts) return -1;
        if(a.pts < b.pts) return 1;
        if((a.gGF - a.gGA) > (b.gGF - b.gGA)) return -1;
        if((a.gGF - a.gGA) < (b.gGF - b.gGA)) return 1;
        if(a.gGF > b.gGF) return -1;
        if(a.gGF < b.gGF) return 1;
        return 0;
    })
    for(let i = 0; i < teamArr.length;i++){
        if(i > 0 
        && teamArr[i].pts == teamArr[i-1].pts
        && teamArr[i].gGF == teamArr[i-1].gGF
        && teamArr[i].gGA == teamArr[i-1].gGA){
            teamArr[i].gRanking = teamArr[i-1].gRanking
        } else {
            teamArr[i].gRanking = i + 1;
        }
    }
    teamArr.sort((a,b)=>{
        if(a.farthestRound > b.farthestRound) return -1;
        if(a.farthestRound < b.farthestRound) return 1;
        if(a.farthestRound > 0 && b.farthestRound > 0){
            if((a.roundDetails.gf - a.roundDetails.ga) > (b.roundDetails.gf - b.roundDetails.ga)) return -1;
            if((a.roundDetails.gf - a.roundDetails.ga) < (b.roundDetails.gf - b.roundDetails.ga)) return 1;
            if(a.roundDetails.gf > b.roundDetails.gf) return -1;
            if(a.roundDetails.gf > b.roundDetails.gf) return 1;
        }
        if(a.pts > b.pts) return -1;
        if(a.pts < b.pts) return 1;
        if((a.gGF - a.gGA) > (b.gGF - b.gGA)) return -1;
        if((a.gGF - a.gGA) < (b.gGF - b.gGA)) return 1;
        if(a.gGF > b.gGF) return -1;
        if(a.gGF < b.gGF) return 1;
        return 0;
    })
    for(let i = 0; i < teamArr.length;i++){
        if(i > 16 
        && teamArr[i].pts == teamArr[i-1].pts
        && teamArr[i].gGF == teamArr[i-1].gGF
        && teamArr[i].gGA == teamArr[i-1].gGA){
            teamArr[i].oRanking = teamArr[i-1].oRanking
        } else if (i > 0 && i < 16 
        && teamArr[i].farthestRound == teamArr[i-1].farthestRound
        && teamArr[i].roundDetails.gf == teamArr[i-1].roundDetails.gf
        && teamArr[i].roundDetails.ga == teamArr[i-1].roundDetails.ga
        ) {
            teamArr[i].oRanking = teamArr[i-1].oRanking
        } else {
            teamArr[i].oRanking = i + 1;
        }
    }
</script>
Underlined rankings indicate teams that advanced despite ranking in the bottom half of the group stage or teams that failed to advance despite ranking in the top half of the group stage.
<table>
    {#if data.cupID > 2}
    <tr>
        <th></th>
        <th colspan=5>Group Stage</th>
        <th colspan=4>Overall</th>
    </tr>
    {/if}
    <tr>
        <th>Team</th>
        {#if data.cupID > 2}
        <th>Ranking</th>
        <th>GF</th>
        <th>GA</th>
        <th>GD</th>
        <th>Pts</th>
        {/if}
        <th>Ranking</th>
        <th>GF</th>
        <th>GA</th>
        <th>GD</th>
    </tr>
    {#each teamArr as row}
        <tr>
            <td><TeamLink team={row.team} /><TeamIcon team={row.team} /></td>
            {#if data.cupID > 2}
            <td class={row.gRanking == 1 ? 'Gold' : (row.gRanking == 2 ? 'Silver' : (row.gRanking == 3 ? 'Bronze' : ''))}
            style:text-decoration={((row.gRanking > 16 && row.oRanking < 17) || (row.gRanking < 17 && row.oRanking > 16) ) ? 'underline' : ''} 
            >
                {row.gRanking}</td>
            <td>{row.gGF}</td>
            <td>{row.gGA}</td>
            <td>{row.gGF - row.gGA}</td>
            <td>{row.pts}</td>
            {/if}
            <td class={row.oRanking == 1 ? 'Gold' : (row.oRanking == 2 ? 'Silver' : (row.oRanking == 3 ? 'Bronze' : ''))}
            style:text-decoration={((row.gRanking > 16 && row.oRanking < 17) || (row.gRanking < 17 && row.oRanking > 16) ) ? 'underline' : ''}
            >{row.oRanking}</td>
            <td>{row.gGF + row.oGF}</td>
            <td>{row.gGA + row.oGA}</td>
            <td>{(row.gGF + row.oGF) - (row.gGA + row.oGA)}</td>
        </tr>
    {/each}
</table>
<style>
</style>