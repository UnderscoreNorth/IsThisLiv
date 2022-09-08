<script>
    import { page } from "$app/stores";
    import config from '../../config.json';
    let api = config.api;
    
    /**
    * @type {any[]}
    */
    let data = [];
    let search = "";
    let searching = false;
    let lastSearch = "-1";
    async function searchPlayer(){
        if(!searching){
            searching = true;
            data = await fetch(`${api}api/playerSearch`,{
                method:'POST',
                headers:{
                    'Content-Type':'application/json'
                },
                body:JSON.stringify({search:search})}).then((result)=>{
                searching = false;
                return result.json();
            });
            if(lastSearch != '-1'){
                lastSearch = "-1"
                searchPlayer();
            }
        } else {
            lastSearch = search;
        }
    }
</script>
<div id='container'>
    <vertNav class='c-1'>
        <input bind:value={search} placeholder='Search' on:input={searchPlayer}/>
        <div id='searchResults'>
            {#each data as player}
                <div style='margin-bottom:0.2rem'>
                <a href='/players/{player.id}-{player.urlName}'>
                    <div class='teamTag'>/{player.team}/</div>
                    <div class='playerTag'>{player.name}</div></a>
                </div>
            {/each}
        </div>
    </vertNav>
    <slot>

    </slot>
</div>
<style>
    #container{
        display:grid;
        grid-template-columns:14rem 1fr;
        position:relative;
        height:100%;
    }
    #searchResults{
        margin-top: 1rem;
        overflow-x: hidden;
        overflow-y: scroll;
        overflow-wrap: break-word;
        margin-right: -1rem;
        height:calc(100vh - 7rem);
    }
    #searchResults a{
        display:block;
        font-size:0.9rem;
    }
    #searchResults a div{
        display:inline-block;
    }
    .teamTag{
        width:2.8rem;
        vertical-align: top;
    }
    .playerTag{
        padding-left:0.1rem;
        width:calc(100% - 3.2rem);
    }
</style>


