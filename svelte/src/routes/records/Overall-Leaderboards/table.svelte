<script lang='ts'>
    export let title:string
    export let headers:string[];
    export let rows:string[][];
</script>
    <div class='leaderboard'>
        <div class='title'>{title}</div>
        <div class='table' style:grid-template-columns={headers.map((x,i)=>i==0 ? '2rem' : 'auto').join(' ')}>
            {#each headers as header}
            <div class='cell headers'><b>{header}</b></div>
            {/each}
            {#each rows as row}
            {#each row as cell}
            <div class='cell'>{@html cell}</div>
            {/each}
        {/each}
        </div>
    </div>
<style>
    
.leaderboard{
   display:inline-block;
   vertical-align:top;
   margin:20px;
   height:20rem;
   overflow-y:auto;
   flex-basis:0;
   flex-grow:1;
   min-width: 300px;
   max-width: 600px;
   position:relative
}
.table{
    display:grid;
    grid-template-rows: 1.5rem;
}
.cell{
    text-overflow:ellipsis;
    overflow:hidden;
    white-space:nowrap;                                                                                              
    text-align:left;
    line-height: 1.5rem;
}
.title, .headers{
    position: sticky;
    background:var(--bg-color);
    z-index: 1;
}
.title{
    top:0
}
.headers{
    top:calc(1rem + 2px);
}
</style>