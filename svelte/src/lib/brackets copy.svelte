<svelte:head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/brackets-viewer@latest/dist/brackets-viewer.min.css" />
    <script src="https://cdn.jsdelivr.net/npm/brackets-viewer@latest/dist/brackets-viewer.min.js" on:load={renderBracket}></script>
</svelte:head>
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
                case 10: return 4;
                case 9: return 2;
                case 8: return 1;
                case 7: return 0;
            }
    }
    
    for (let i in data.matches.kos){
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
    console.log(teamIDs)
    console.log(matches);
    const ELEMENT_ID = 'bracket';
    function renderBracket(data){
        document.getElementById(ELEMENT_ID).innerHTML = '';
        window.bracketsViewer.render({
            stages:stage,
            matches:matches,
            matchGames: [],
            participants: teams,
        }, {
            customRoundName:(info,t)=>{
                switch(info.roundNumber){
                    case 1: return 'Round of 16';
                    case 2: return 'Quarter Finals';
                    case 3: return 'Semi Finals';
                    case 4: return 'Final';
                    case 5: return '3rd Place'
                }
            },
            selector: '#' + ELEMENT_ID,
            participantOriginPlacement: 'before',
            separatedChildCountLabel: false,
            showSlotsOrigin: false,
            showLowerBracketSlotsOrigin: true,
            highlightParticipantOnHover: false,
            
        });
    }
</script>
<brackets id='bracket' class='brackets-viewer'>
</brackets>
<STYLE>
    .brackets-viewer {
        /* Colors */
        --primary-background: rgba(38, 38, 38,0.5);
        --secondary-background: #303030;
        --match-background: var(--primary-background);
        --font-color: #d9d9d9;
        --win-color: #50b649;
        --loss-color: #e61a1a;
        --label-color: grey;
        --hint-color: #a7a7a7;
        --connector-color: #9e9e9e;
        --border-color: #d9d9d9;
        --border-hover-color: #b6b5b5;
      
        /* Sizes */
        --text-size: 12px;
        --round-margin: 40px;
        --match-width: 150px;
        --match-horizontal-padding: 8px;
        --match-vertical-padding: 6px;
        --connector-border-width: 2px;
        --match-border-width: 1px;
        --match-border-radius: 0.3em;
      }
</STYLE>