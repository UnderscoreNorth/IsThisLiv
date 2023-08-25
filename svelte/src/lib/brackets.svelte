<script>
    export let data;
    let stage = [{
        id:0,
        tournament_id:data.cupID,
        type:'single_elimination',
        name:'',
        settings:{
            size:16,
            seedOrdering:'natural',
            balanceByes:false,
            matchesChildCount:0,
            consolationFinal: true
        },
        number:1
    }];
    let teams = [];
    let teamIDs = {};
    for(let i of data.teams){
        teamIDs[i.name] = teams.length;
        teams.push({
            id:teams.length,
            name:`/${i.name}/`,
            tournament_id:data.cupID
        });
    }
    let matches = [];
    let matchCounter = 0;
    let matchResults = [];
    let getRoundOrder = (x)=>{
        switch(x){
                case 11: return 3;
                case 10: return 3;
                case 9: return 2;
                case 8: return 1;
                case 7: return 0;
            }
    }
    
    for (let i in data.matches.kos){
        let matchCount = data.matches.kos[i].length;
        for(let j in data.matches.kos[i].matches){            
            let match = data.matches.kos[i].matches[j];
            let round_id;
            matches.push({
                id:matchCounter,
                number:j*1+1,
                stage_id:0,
                group_id:0,
                round_id:getRoundOrder(match.roundOrder),
                child_count:0,
                opponent1:{
                    id:teamIDs[match.home],
                    result:match.home == match.winner ? 'win' : 'loss',
                    score:match.homeg,
                    position:1,
                },
                opponent2:{
                    id:teamIDs[match.away],
                    result:match.away == match.winner ? 'win' : 'loss',
                    score:match.awayg,
                    position:2,
                },
                status:4
            });
            matchCounter++;
        }
    }

</script>
{#await data}
    Loading...
{:then data} 
<bracket>
    {#each data.matches.kos as round}
    <div class='bracketRound'>
        {#each round.matches as match}
            <div class='bracketMatch'>
                <div>{match.home}</div><div>{match.homeg}</div>
                <div>{match.away}</div><div>{match.awayg}</div>
            </div>
        {/each}
    </div>
    {/each}
</bracket>
{/await}
<style>
    bracket{
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: 1fr;
        grid-column-gap: 0px;
        grid-row-gap: 0px;
    }
    .bracketRound{
        height:20rem;
        display:grid;
        
    }
    .bracketMatch{
        display:grid;
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(2, 1fr);
        grid-column-gap: 0px;
        grid-row-gap: 0px;
    }
</style>
