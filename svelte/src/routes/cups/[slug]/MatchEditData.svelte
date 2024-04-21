<script lang="ts">
	import { browser } from "$app/environment";
	import { api } from "$lib/helper";
	export let data: MatchStat;
    export let close:Function;
    export let getData:Function;
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
	const halves = [{ name: 'First Half' }, { name: 'Second Half' }, { name: 'Eggstra Dime' }];
    const addEvent = (i:number) =>{        
        data.events[i].push({
            event:{
            },
            player:{}
        })
        data = data;
    }
    const addPenalty = (i:number) =>{        
        data.penalties[i].push({
            penalty:{
            },
            player:{}
        })
        data = data;
    }
    const addNewEvent = (i:number)=>{
        if(data.events[i][data.events[i].length -1].event.regTime){
            data.events[i].push({
                event:{
                },
                player:{}
            })
            data = data;
        }
    }
    let saving = false;
    const saveData = async()=>{
        saving = true;
        const result = await api('/sql/matchSave/',{data});               
        data = await getData();
        saving = false;
    }
    let ratingsOnly = false;
    let condOnly = false;
    let subOnly = false;    
    const sI = ['Home','Away'];
    let errors:string[] = [];
    checkChange();
    function checkChange(){
        errors = [];
        for(const i of [0,1]){
            let statSaves = 0;
            let finalPeriod = 0;
            for(const j of [0,1,2]){
                if(data.matchStats?.[j]?.[i]){
                    for(const row of data.matchStats[j][i]){
                        if(row.name == 'Saves' && parseInt(row.value) > statSaves){
                            statSaves = parseInt(row.value);
                            finalPeriod = j;
                        }
                    }
                }
            }
            let perfSaves = 0;
            let playTime = 0;
            for(const perf of data.performances[i]){
                if(perf?.performance?.saves && perf.performance.saves > 0){
                    perfSaves += perf.performance.saves
                }
                if(typeof perf?.performance?.subOn == 'number' && typeof perf?.performance?.subOff == 'number'){
                    playTime += perf.performance.subOff - perf.performance.subOn;
                }
            }
            let goals:string[] = [];
            for(const event of data.events[i]){
                if(typeof event?.event?.eventType !== 'undefined' && [1,4].includes(event.event.eventType)){
                    goals.push(event.event.regTime?.toString() + event.event.injTime?.toString())
                }
            }
            for(const event of data.events[i]){
                if(typeof event?.event?.eventType !== 'undefined' && [2].includes(event.event.eventType)){
                    let str = event.event.regTime?.toString() + event.event.injTime?.toString();
                    if(!goals.includes(str)) errors.push(`${sI[i]} has assist without goal at ${event.event.regTime}`)
                }
            }
            if(playTime % (finalPeriod == 2 ? 120 : 90) !== 0) errors.push(`${sI[i]} sub on/off times has inconsistencies`)
            if(statSaves !== perfSaves) errors.push(`${sI[i]} saves don't add up to stat card`);
            
        }
    }
</script>
{#if errors.length}
<div id='errors'>
    <b>Errors</b><hr>
    {#each errors as error}
        <div>{error}</div>
    {/each}
</div>
{/if}
<div id='matchContainer'>
<div id='matchMeta'>
    <table style="margin-left:auto;margin-right:auto;">
        <tr>
            <th>ID</th><th>Stage</th><th>Date</th><th>Stadium</th><th>Attend</th><th>Winner</th><th
                >Official</th><th>Valid</th>
            <th>Pes</th>
        </tr>
        <tr>
            <td>{data.matchID}</td>
            <td>
                <select id="round" bind:value={data.round} style='width:8rem'>
                    {#each data.rounds as round}
                        <option>{round}</option>
                    {/each}
                </select>
            </td>
            <td>
                <input
                    id="matchDate"
                    value={data.date}
                    type="datetime-local"
                    style='width:11rem'
                />
            </td>
            <td>
                <input id="stadium" bind:value={data.stadium} placeholder="Stadium" list="stadiumlist" style='width:5rem' />
                <datalist id="stadiumlist">
                    {#each data.stadiums as stadium}
                        <option value={stadium} />
                    {/each}
                </datalist>
            </td>
            <td><input id="attendance" bind:value={data.attendence} placeholder="Attendance" style='width:3rem' /></td>
            <td>
                <select id="winner" bind:value={data.winner}>
                    {#each data.teams as team}
                        <option>{team}</option>
                    {/each}
                </select>
            </td>
            <td
                ><input
                    style="transform:scale(2)"
                    type="checkbox"
                    id="official"
                    bind:checked={data.off}
                /></td
            >
            <td
                ><input
                    style="transform:scale(2)"
                    type="checkbox"
                    id="official"
                    bind:checked={data.valid}
                /></td
            >
            <td><input id="version" bind:value={data.version} style='width:3rem'/></td>
        </tr>
    </table>
</div>
<div id='matchStats'>
    <h3>Scorecards</h3>
    <scorecards>
        {#each halves as half, i}
            <table id="matchstat1" style="text-align:center">
                <tr><th colspan="3">{half.name}</th></tr>
                {#each data.matchStats[i][0] as row, j}
                    <tr>
                        <td
                            ><input
                                bind:value={data.matchStats[i][0][j].value}
                                on:change={()=>{checkChange()}}
                                disabled={row.name == 'SQL ID' ||
                                (data.version >= 2018 && row.name == 'Pass completed (%)') ||
                                (data.version < 2018 && row.name == 'Passes') ||
                                (data.version < 2018 && row.name == '(Made)')
                                    ? true
                                    : false}
                            /></td
                        >
                        <td>{row.name}</td>
                        <td
                            ><input
                                bind:value={data.matchStats[i][1][j].value}
                                on:change={()=>{checkChange()}}
                                disabled={row.name == 'SQL ID' ||
                                (data.version >= 2018 && row.name == 'Pass completed (%)') ||
                                (data.version < 2018 && row.name == 'Passes') ||
                                (data.version < 2018 && row.name == '(Made)')
                                    ? true
                                    : false}
                            /></td
                        >
                    </tr>
                {/each}              
            </table>
        {/each}
    </scorecards>
</div>
<div id='matchPerformances'>   
    <h3>Performances<br>
        <button on:click={()=>{ratingsOnly=!ratingsOnly}}>Ratings Only</button>
        <button on:click={()=>{condOnly=!condOnly}}>Cond Only</button>
        <button on:click={()=>{subOnly=!subOnly}}>Sub Only</button>
    </h3>
    <scorecards>
        {#each data.performances as performances,i}
            <div>
                /{data.teams[i+1]}/
                <table>
                    <tr>
                        <th>ID</th>
                        <th>Player</th>
                        <th>Cond</th>
                        <th>Rating</th>
                        <th>Saves</th>
                        <th>Sub On</th>
                        <th>Sub Off</th>
                        <th>MotM</th>
                    </tr>
                    {#each Array(15) as _, j}
                        <tr>
                            <td>{data.performances[i][j]?.performance.perfID || ''}</td>
                            <td><select bind:value={data.performances[i][j].player.playerID} disabled={condOnly || subOnly}>
                                <option></option>
                                {#each Object.values(data.players[i]) as {player}}
                                    <option value={player.playerID}>{player.name}</option>
                                {/each}
                                </select>
                            </td>
                            <td>
                                <select disabled={ratingsOnly || subOnly} bind:value={data.performances[i][j].performance.cond}>
                                    <option></option>
                                    <option value={1} >1 ↓</option>
                                    <option value={2} >2 ↘</option>
                                    <option value={3} >3 →</option>
                                    <option value={4} >4 ↗</option>
                                    <option value={5} >5 ↑</option>	
                            </select>
                            </td>
                            <td>
                                <input bind:value={data.performances[i][j].performance.rating} type='number' step='0.5' disabled={condOnly || subOnly}/>
                            </td>
                            <td>
                                <input on:change={()=>{checkChange()}} bind:value={data.performances[i][j].performance.saves} type='number' step='1' disabled={ratingsOnly || condOnly || subOnly}/>
                            </td>
                            <td>
                                <input on:change={()=>{checkChange()}} bind:value={data.performances[i][j].performance.subOn} type='number' disabled={ratingsOnly || condOnly}/>
                            </td>
                            <td>
                                <input on:change={()=>{checkChange()}} bind:value={data.performances[i][j].performance.subOff} type='number' disabled={ratingsOnly || condOnly} />
                            </td>
                            <td>
                                <input bind:group={data.motm} type='radio' value={data.performances[i][j].player.playerID} disabled={ratingsOnly || condOnly || subOnly}/>
                            </td>
                        </tr>
                    {/each}
                </table>
            </div>
        {/each}
    </scorecards>
</div>
<div id='matchEvents'>
    <h3>Events</h3>
    <scorecards>
        {#each data.events as events,i}
            <div>
                /{data.teams[i+1]}/
                <table>
                    <tr>
                        <th>ID</th>
                        <th>Player</th>
                        <th>Event</th>
                        <th>Reg Time</th>
                        <th>Inj Time</th>
                    </tr>
                {#each events as {event,player},j}
                    <tr>
                        <td>{event.eventID ?? ''}</td>
                        <td>
                            <select bind:value={player.playerID}>
                                <option></option>
                                {#each Object.values(data.players[i]) as {player}}
                                    <option value={player.playerID}>{player.name}</option>
                                {/each}
                            </select>
                        </td>
                        <td><select on:change={()=>{checkChange()}} bind:value={event.eventType}>
                            <option></option>
                            {#each Object.keys(data.eventType) as i}
                                <option value={parseInt(i)}>{data.eventType[parseInt(i)]}</option>
                            {/each}
                        </select></td>
                        <td><input on:change={()=>{addNewEvent(i);checkChange()}} bind:value={event.regTime}/></td>
                        <td><input on:change={()=>{checkChange()}} bind:value={event.injTime}/></td>
                    </tr>
                {/each}
                <tr>
                    <td colspan=5>
                        <button on:click={()=>addEvent(i)}>Add Event</button>
                    </td>
                </tr>
                </table>
            </div>
        {/each}
    </scorecards>
</div>
<div id='matchPenalties'>
    <h3>Penalties</h3>
    <scorecards>
        {#each data.penalties as penalties,i}
            <div>
                /{data.teams[i+1]}/
                <table>
                    <tr>
                        <th>ID</th>
                        <th>Player</th>
                        <th>Goal</th>
                    </tr>
                {#each penalties as {penalty,player},j}
                    <tr>
                        <td>{penalty.penaltyID ?? ''}</td>
                        <td>   
                            <select bind:value={player.playerID}>
                                <option></option>
                                {#each Object.values(data.players[i]) as {player}}
                                    <option value={player.playerID}>{player.name}</option>
                                {/each}
                            </select>
                        </td>
                        <td><input bind:checked={penalty.goal} type='checkbox'/></td>
                    </tr>
                {/each}
                <tr>
                    <td colspan=3>
                        <button on:click={()=>addPenalty(i)}>Add Player</button>
                    </td>
                </tr>
                </table>
            </div>    
        {/each}
    </scorecards>
</div>
<button
    style='padding:1rem;margin:1rem'
    on:click={() => {
        saveData();
    }} disabled={saving}>{saving ? 'Saving' : 'Save'}</button
>
</div>
<style>
    #matchContainer{
        display:grid;
        width:100%;
        font-size:70%;
        grid-template-columns: auto auto; 
        grid-template-rows: auto auto auto auto; 
        gap: 0px 0px; 
        grid-template-areas: 
            "matchMeta matchPerformances"
            "matchStats matchPerformances"
            "matchStats matchEvents"
            "matchPenalties matchEvents"; 
    }
    @media only screen and (max-width:1900px){
        #matchContainer{
            display:flex;
            width:100%;
            font-size:70%;
            flex-direction: column;
        }
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
	scorecards {
		display: flex;
		justify-content: center;
	}
	scorecards input, #matchEvents input, #matchPerformances input {
		width: 3rem;
	}
    #matchEvents select{
        width:6rem;
    }
    #matchPerformances select{
        max-width:6rem;
    }
	td {
		text-align: center;
        padding:0 0.25rem;
	}
    #errors{
        position:fixed;
        top:3rem;
        left:3rem;
        background:#AA0000AA;
        padding:1rem;
        text-align: left;
        pointer-events: none
    }
</style>
