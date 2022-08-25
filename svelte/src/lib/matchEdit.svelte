<script>
    /**
     * @param {number} matchID
     */
    export let matchID;
    let api = config.api;
    import config from '../config.json';
    function close(){
        matchID = 0;
    }
    let halves = [
        {name:'First Half'},
        {name:'Second Half'},
        {name:'Eggstra Dime'},
    ];
   
    let data = (async()=>{
        const response = await fetch(`${api}api/sql/matchDisplay/` + matchID);
        return await response.json();
    })();
    /**
     * 
     * @param {object} data
     */
    function getData(data){
        console.log(data);
    }
    
</script>
<closeout>
{#await data}
    <container class='c-2'>
        Loading...
    </container>
{:then data} 
    <container class='c-2'>
        <x on:click={()=>{close()}}>X</x>
        <button on:click={()=>{getData(data)}}>Save</button>
        <table style="margin-left:auto;margin-right:auto;">
            <tr>
                <th>ID</th><th>Stage</th><th>Date</th><th>Stadium</th><th>Attend</th><th>Winner</th><th>Official</th><th>Pes</th>
            </tr>
            <tr>
                <td>{matchID}</td>
                <td><select id="round">
                    {#each data.rounds as round}
                        <option selected={(round == data.round ? true:false)}>{round}</option>
                    {/each}
                </select></td>
                <td><input id="matchDate" value={data.date} placeholder="YYYY-MM-DD HH:MM:SS"></td>
                <td><input id="stadium" value={data.stadium} placeholder="Stadium" list="stadiumlist">
                    <datalist id="stadiumlist">
                        {#each data.stadiums as stadium}
                            <option value={stadium}></option>
                        {/each}
                    </datalist>
                </td>
                <td><input id="attendance" value={data.attendence} placeholder="Attendance"></td>
                <td><select id="winner">
                    {#each data.teams as team}
                        <option selected={(data.winner == team ? true:false)}>{team}</option>
                    {/each}
                </select></td>
                <td><input style="transform:scale(2)" type="checkbox" id="official" checked={data.off}></td>
                <td><input id="version" value={data.version}></td>
            </tr>
        </table>
        <h3>Scorecards</h3>
        <scorecards>
            {#each halves as half,i}
                <table id="matchstat1" style="text-align:center">
                    <tr><th colspan=3>{half.name}</th></tr>
                    {#if data.matchStats[i][0]}
                        {#each data.matchStats[i][0] as row,j}
                            <tr>
                                <td><input 
                                    bind:value={row.value} 
                                    disabled={
                                        (row.name=='SQL ID'
                                        || (data.version >= 2018 && row.name == 'Pass completed (%)')
                                        || (data.version < 2018 && row.name == 'Passes')
                                        || (data.version < 2018 && row.name == '(Made)')
                                        )?true:false}
                                    ></td>
                                <td>{row.name}</td>
                                <td><input 
                                    value={data.matchStats[i][1][j].value}
                                    disabled={    
                                        (row.name=='SQL ID'
                                        || (data.version >= 2018 && row.name == 'Pass completed (%)')
                                        || (data.version < 2018 && row.name == 'Passes')
                                        || (data.version < 2018 && row.name == '(Made)')
                                        )?true:false}
                                    ></td>
                            </tr>
                        {/each}
                    {:else}
                        {#each data.matchStats[0][0] as row,j}
                            <tr>
                                <td><input home=1
                                    disabled={
                                        (row.name=='SQL ID'
                                        || (data.version >= 2018 && row.name == 'Pass completed (%)')
                                        || (data.version < 2018 && row.name == 'Passes')
                                        || (data.version < 2018 && row.name == '(Made)')
                                        )?true:false}></td>
                                <td>{row.name}</td>
                                <td><input home=0
                                    disabled={
                                        (row.name=='SQL ID'
                                        || (data.version >= 2018 && row.name == 'Pass completed (%)')
                                        || (data.version < 2018 && row.name == 'Passes')
                                        || (data.version < 2018 && row.name == '(Made)')
                                        )?true:false}></td>
                            </tr>
                        {/each}
                    {/if}
                </table>    
            {/each}
        </scorecards>
    </container>
{/await}
</closeout>

<style>
    container{
        position:fixed;
        top:3rem;
        left:3rem;
        right:3rem;
        bottom:3rem;
        z-index: 3;
        overflow-y:scroll;
        padding:1rem;
        text-align: center;
        box-shadow:0 0.5rem 0.5rem black;
    }
    closeout{
        position:fixed;
        height:100%;
        width:100%;
        z-index: 2;
        top:0;
        left:0;
    }
    x{
        float:right;
        width:2rem;
        height:2rem;
        text-align: center;
        line-height: 2rem;
        margin:0.5rem;
        cursor: pointer;
        border-radius: 0.25rem;
        background:rgb(145, 3, 3);
        color:white;
    }
    x:hover{
        background:rgb(95, 8, 8);
    }
    scorecards{
        display:flex;
        justify-content: center;
    }
    scorecards input{
        width:3rem;
    }
    scorecards td{
        text-align: center;
    }
</style>