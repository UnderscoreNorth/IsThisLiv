<script lang='ts'>
	import Datetime from "$lib/datetime.svelte";
	import EventIcon from "$lib/eventIcon.svelte";
import { api } from "$lib/helper";
	import Modal from "$lib/modal.svelte";
	import TeamIcon from "$lib/teamIcon.svelte";
    import PenaltyIcon from '$lib/penaltyIcon.svelte'
    import CondIcon from "$lib/condIcon.svelte";
	import TeamLink from "$lib/teamLink.svelte";

    type Event = {
        eventID?:number;
        matchID?:number;
        playerID?:number;
        eventType?:number;
        regTime?:number;
        injTime?:number;
    }
    type Player = {
        playerID?:number;
        team?:string;
        cupID?:number;
        name?:string;
    }
    type Performance = {
        perfID?:number;
        playerID?:number;
        subOn?:number;
        subOff?:number;
        rating?:number;
        saves?:number;
        motm?:boolean;
        cond?:number;
    }
    type Penalty = {
        penaltyID?:number;
        playerID?:number;
        goal?:boolean;
    }
	type MatchStat = {
		matchID: number;
		rounds: Array<string>;
		round: string;
		date: Date;
		stadiums: Array<string>;
		stadium: string;
		attendence: number;
		teams: Array<string>;
		winner: string;
		off: boolean;
        valid:boolean;
		version: number;
		matchStats: Array<Array<Array<{sql:string,name:string,value:number}>>>;
        eventType: string[];
        events:Array<Array<{event:Event,player:Player}>>;
        performances:Array<Array<{player:Player,performance:Performance}>>;
        players:Array<Array<{player:Player}>>;
        penalties:Array<Array<{player:Player,penalty:Penalty}>>
	}

    export let matchID:number;
    let req = Promise.all([api('/sql/matchDisplay/' + matchID),api('/sql/matchHistory/' + matchID)]).then((x)=>{
        console.log(x)
        return {data:x[0] as MatchStat, history:x[1]}
    })
    const halves = [{ name: 'First Half' }, { name: 'Second Half' }, { name: 'Eggstra Dime' }];
    function getScore(data:MatchStat,team:string){
        let index = data.teams[1] == team ? 0 : 1;
        return data.events[index].filter((x)=>{
                if(x.player.team == team && [1,4].includes(x.event.eventType ?? -1) || x.player.team !== team && [3].includes(x.event.eventType ?? -1))
                return true;
            return false;
            }).length
    }
    function getResult(team:string,winningTeam:string){
        if(winningTeam == 'draw') return 'D';
        if(winningTeam == team) return 'W';
        return 'L'
    }
</script>
<Modal title={'Match Details'} close={()=>matchID = 0}>
    {#await req}
        Loading...
    {:then {data,history}} 
    <div id='matchContainer'>
        <div id='matchMeta'>
            <table style="margin-left:auto;margin-right:auto;">
                <tr>
                    <th>ID</th><th>Stage</th><th>Date</th><th>Stadium</th><th>Attend</th><th>Winner</th><th
                        >Official</th><th>Valid</th>
                    <th>Pes</th>
                </tr>
                <tr>
                    <td>{matchID}</td>
                    <td>{data.round}
                    </td>
                    <td>
                        <Datetime date={data.date}/>
                    </td>
                    <td>
                        {data.stadium || 'TBD'}
                    </td>
                    <td>{data.attendence}</td>
                    <td>
                        <TeamIcon team={data.winner}/>{data.winner == '' ? '' : '/' + data.winner + '/'}
                    </td>
                    <td
                        ><input
                            style="transform:scale(2)"
                            type="checkbox"
                            id="official"
                            disabled
                            checked={data.off}
                        /></td
                    >
                    <td
                        ><input
                            style="transform:scale(2)"
                            type="checkbox"
                            id="official"
                            disabled
                            checked={data.valid}
                        /></td
                    >
                    <td>{data.version}</td>
                </tr>
            </table>            
            <h3>
                
                <TeamIcon team={data.teams[1]}/><TeamLink team={data.teams[1]}/> 
                {getScore(data,data.teams[1])} - {getScore(data,data.teams[2])}
                <TeamLink team={data.teams[2]}/><TeamIcon team={data.teams[2]}/></h3>
        </div>
        <div id='matchStats'>
            {#if data.matchStats[0]?.[0]?.[0].value >= 0}
            <h3>Scorecards<hr></h3>
            <scorecards>
                {#each halves as half, i}
                {#if data.matchStats[i][0][0].value >= 0}
                <table id="matchstat1" style="text-align:center">
                    <tr><th colspan="3">{half.name}</th></tr>
                    {#each data.matchStats[i][0] as row, j}
                        {#if j > 0}
                        <tr>
                            <td>{data.matchStats[i][0][j].value}</td>
                            <td>{row.name}</td>
                            <td>{data.matchStats[i][1][j].value}</td>
                        </tr>
                        {/if}
                        
                    {/each}              
                </table>
                {/if}
                    
                {/each}
            </scorecards>
            {/if}
        </div>
        <div id='matchPerformances'> 
            {#if data.performances?.[0]?.[0]}  
            <h3>Performances<hr></h3>
            <scorecards>
                {#each data.performances as performances,i}
                    <div>
                        <table>
                            <tr>
                                <th>Player</th>
                                <th>Cond</th>
                                <th>Rating</th>
                                <th>Saves</th>
                                <th>Sub On</th>
                                <th>Sub Off</th>
                            </tr>
                            {#each Array(15) as _, j}
                                {#if data.performances[i][j]}
                                <tr>
<td style:text-align={'right'} style={data.motm == data.performances[i][j].player.playerID ? 'font-weight:bold;text-decoration:underline' : ''}
    class={data.performances[i][j].player.medal}
>
    <a class='playerLink' title={data.players[i].filter(x=>x.player.playerID == data.performances[i][j].player.playerID)[0].player.name} href='/players/{data.players[i].filter(x=>x.player.playerID == data.performances[i][j].player.playerID)[0].player.linkID}-{data.players[i].filter(x=>x.player.playerID == data.performances[i][j].player.playerID)[0].player.name?.replaceAll(' ','')}'>{data.players[i].filter(x=>x.player.playerID == data.performances[i][j].player.playerID)[0].player.name}</a>
</td>
                                    <td><b><CondIcon cond={data.performances[i][j].performance.cond} /></td>
                                    <td>
                                        {data.performances[i][j].performance.rating}
                                    </td>
                                    <td>
                                        {(data.performances[i][j].performance.saves ?? -1) >= 0 ? data.performances[i][j].performance.saves : '' }
                                    </td>
                                    <td>
                                        {data.performances[i][j].performance.subOn}
                                    </td>
                                    <td>
                                        {data.performances[i][j].performance.subOff}
                                    </td>
                                </tr>
                                {/if}
                               
                            {/each}
                        </table>
                    </div>
                {/each}
            </scorecards>
            {/if}
        </div>
        <div id='matchEvents'>
            <h3>Events<hr></h3>
            <scorecards>
                {#each data.events as events,i}
                    <div style:width={'50%'}>
                        <table style:margin='auto'>
                        {#each events as {event,player},j}
                            <tr>
                                <td>
                                    <a href='/players/{player.linkID}-{player.name?.replaceAll(' ','')}'>{player.name}</a>
                                </td>
                                <td>
                                   <EventIcon eventType={event.eventType}/> 
                                </td>
                                <td>{event.regTime}{event.injTime >= 0 ? '+'+ event.injTime : ''}'</td>
                            </tr>
                        {/each}
                        </table>
                    </div>
                {/each}
            </scorecards>
        </div>
        <div id='matchPenalties'>
            {#if data.penalties?.[0]?.[0]}
            <h3>Penalties<hr></h3>
            <scorecards>
                {#each data.penalties as penalties,i}
                <div style:width={'50%'}>
                    <table style:margin='auto'>
                        {#each penalties as {penalty,player},j}
                            <tr>
                                <td>  
                                    {data.players[i].filter(x=>x.player.playerID == player.playerID)[0].player.name}
                                </td>
                                <td><PenaltyIcon goal={penalty.goal}></PenaltyIcon></td>
                            </tr>
                        {/each}
                        </table>
                    </div>    
                {/each}
            </scorecards>
            {/if}
        </div>
        <div id='matchHistory'>
            <h3>Previous History<hr></h3>
            {#if history.matches.length}
            <table>
                <tr>
                    <th colspan=3>Official Record</th>
                </tr>
                <tr>
                    <td colspan=3>{history.matches.filter(x=>x.match.homeTeam == x.match.winningTeam && x.match.valid).length}-{history.matches.filter(x=>'draw'== x.match.winningTeam && x.match.valid).length}-{history.matches.filter(x=>x.match.awayTeam == x.match.winningTeam && x.match.valid).length}</td>
                    <th>Cup</th><th>Round</th><th>Date</th>
                </tr>
                {#each history.matches as {match,cup}}
                    <tr style:text-decoration={match.valid ? '' : 'line-through'}>
                        <td class={getResult(match.homeTeam,match.winningTeam)}><TeamIcon team={match.homeTeam} /> /{match.homeTeam}/</td>
                        <td>{#if match.endPeriod > 1}
                                {['','','A.E.T','Pens'][match.endPeriod]}<br>
                            {/if}
                            {match.homeGoals} - {match.awayGoals}</td>
                            <td class={getResult(match.awayTeam,match.winningTeam)}>/{match.awayTeam}/ <TeamIcon team={match.awayTeam} /></td>
                        <td><a href='/cups/{cup.cupID}-{cup.cupName.replaceAll(' ','-')}'>{cup.cupName}</a></td>
                        <td>{match.round}</td>
                        <td><Datetime date={match.utcTime} /></td>
                    </tr>
                {/each}
            </table>
            {:else}
                First time meeting
            {/if}
        </div>
    </div>
    {:catch}
        Something went wrong
    {/await} 
</Modal>
<style>
    #matchContainer{
        display:flex;
        flex-direction: column;
        flex-wrap:wrap;
        max-height:80vh;
        font-size:70%;
        width:fit-content;
    }
    #matchContainer>div{
        max-width:45vw;
    }
    #matchMeta { grid-area: matchMeta; }
    #matchPenalties { 
        grid-area: matchPenalties; 
    }
    #matchStats { grid-area: matchStats; }
    #matchPerformances { 
        grid-area: matchPerformances; 
    }
    #matchEvents { 
        grid-area: matchEvents; 
    }
    #matchHistory{
        grid-area: matchHistory;
    }
    scorecards {
        display: flex;
        justify-content: center;
    }
    td {
        text-align: center;
        padding:0 0.25rem;
    }
    .playerLink{
        max-width: 10rem;
        overflow-x: hidden;
        display: block;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
</style>