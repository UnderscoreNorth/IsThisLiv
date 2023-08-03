<script lang="ts">
	export let data: MatchStat;
	interface MatchStat {
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
		version: number;
		matchStats: Object;
        eventTypes: Object;
        events:Array<Array<Object>>;
	}
	const halves = [{ name: 'First Half' }, { name: 'Second Half' }, { name: 'Eggstra Dime' }];
    const addEvent = (i:number) =>{
        data.events[i].push(
            {iID:'',
            iPlayerID:'',
            iType:'',
            dRegTime:'',
            dInjTime:''}
        );
        data = data;
    }
</script>
<div id='matchContainer'>
<div id='matchMeta'>
    <table style="margin-left:auto;margin-right:auto;">
        <tr>
            <th>ID</th><th>Stage</th><th>Date</th><th>Stadium</th><th>Attend</th><th>Winner</th><th
                >Official</th
            ><th>Pes</th>
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
                {#if data.matchStats[i][0]}
                    {#each data.matchStats[i][0] as row, j}
                        <tr>
                            <td
                                ><input
                                    bind:value={row.value}
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
                                    value={data.matchStats[i][1][j].value}
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
                {:else}
                    {#each data.matchStats[0][0] as row, j}
                        <tr>
                            <td
                                ><input
                                    home="1"
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
                                    home="0"
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
                {/if}
            </table>
        {/each}
    </scorecards>
</div>
<div id='matchPerformances'>
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
                        <td>{data.performances[i][j]?.iID || ''}</td>
                        <td><select bind:value={data.performances[i][j].iPlayerID}>
                            <option></option>
                            {#each Object.values(data.players[i]) as player}
                                <option value={player.iID}>{player.sName}</option>
                            {/each}
                            </select>
                        </td>
                        <td>
                            <select bind:value={data.performances[i][j].iCond}>
                                <option></option>
                                <option value=1 >1 ↓</option>
                                <option value=2 >2 ↘</option>
                                <option value=3 >3 →</option>
                                <option value=4 >4 ↗</option>
                                <option value=5 >5 ↑</option>	
                        </select>
                        </td>
                        <td>
                            <input bind:value={data.performances[i][j].dRating} type='number' step='0.5'/>
                        </td>
                        <td>
                            <input bind:value={data.performances[i][j].iSaves} type='number' step='1'/>
                        </td>
                        <td>
                            <input bind:value={data.performances[i][j].iSubOn} type='number'/>
                        </td>
                        <td>
                            <input bind:value={data.performances[i][j].iSubOff} type='number' />
                        </td>
                        <td>
                            <input bind:group={data.motm} type='radio' value={data.performances[i][j].iPlayerID}/>
                        </td>
                    </tr>
                {/each}
            </table>
        </div>
    {/each}
</div>
<div id='matchPenalties'>
    {#each data.penalties as penalties,i}
    <div>
        /{data.teams[i+1]}/
        <table>
            <tr>
                <th>ID</th>
                <th>Player</th>
                <th>Goal</th>
            </tr>
        {#each penalties as penalty,j}
            <tr>
                <td>{penalty.iID}</td>
                <td>
                    <select bind:value={data.penalties[i][j].iPlayerID}>
                    {#each Object.values(data.players[i]) as player}
                        <option value={player.iID}>{player.sName}</option>
                    {/each}
                    </select>
                </td>
                <td><input bind:checked={data.penalties[i][j].bGoal} type='checkbox'/></td>
            </tr>
        {/each}
        <tr>
            <td colspan=3>
                <button on:click={()=>addEvent(i)}>Add Player</button>
            </td>
        </tr>
        </table>
    </div>
{/each}
</div>
<div id='matchEvents'>
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
            {#each events as event,j}
                <tr>
                    <td>{event.iID}</td>
                    <td>
                        <select bind:value={data.events[i][j].iPlayerID}>
                        {#each Object.values(data.players[i]) as player}
                            <option value={player.iID}>{player.sName}</option>
                        {/each}
                        </select>
                    </td>
                    <td><select value={1}>
                        {#each Object.keys(data.eventType) as i}
                            <option value={i}>{data.eventType[i]}</option>
                        {/each}
                    </select></td>
                    <td><input bind:value={data.events[i][j].dRegTime}/></td>
                    <td><input bind:value={data.events[i][j].dInjTime}/></td>
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
</div>
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
        display:flex;
        justify-content:center;
    }
    #matchStats { grid-area: matchStats; }
    #matchPerformances { 
        grid-area: matchPerformances; 
        display:flex;
        justify-content:center;
    }
    #matchEvents { 
        grid-area: matchEvents; 
        display:flex;
        justify-content:center;
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
</style>
