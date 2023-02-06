<script lang="ts">
    export let data:Array<any>;
    let sortAsc = true;
    let sortField = 'tot';
    const sort = (field:string) =>{
        if(field == sortField){
            sortAsc = !sortAsc;
        } else {
            sortAsc = true;
            sortField = field;
        }
        data.sort((a,b)=>{
            let res = 0;
            const af = a[field] || 0;
            const bf = b[field] || 0;
             if (af > bf){
                res = 1;
            }else if (af < bf) {
                res = -1;
            }
            if(!sortAsc)
                res *= -1;
            return res;
        });
        data = data;  
    }
    sort('tot');
</script>
<table>
    <thead>
        <tr>
            <th>#</th>
            {#if data[0].player}
            <th on:click={()=>{sort('player')}}>Player</th>
            {/if}
            <th on:click={()=>{sort('team')}}>Team</th>
            {#if data[0].pos}
            <th on:click={()=>{sort('pos')}}>Pos</th>
            {/if}
            <th on:click={()=>{sort('r1')}}>R1</th>
            <th on:click={()=>{sort('r2')}}>R2</th>
            <th on:click={()=>{sort('r3')}}>R3</th>
            {#if data[0].r4}
            <th on:click={()=>{sort('r4')}}>R4</th>
            {/if}
            <th on:click={()=>{sort('ro16')}}>Ro16</th>
            <th on:click={()=>{sort('qf')}}>QF</th>
            <th on:click={()=>{sort('sf')}}>SF</th>
            <th on:click={()=>{sort('fn')}}>3rd/Finals</th>
            <th on:click={()=>{sort('tot')}}>Total</th>
        </tr>
    </thead>
    <tbody>
        {#each data as row,i}
        <tr>
            <td>{i+1}</td>
            {#if row.player}
            <td><span class={row.medal}>{row.player}</span></td>
            {/if}
            <td style='max-width:50rem'>{row.team}</td>
            {#if row.pos}
            <td>{row.pos}</td>
            {/if}
            <td>{row.r1 || 0}</td>
            <td>{row.r2 || 0}</td>
            <td>{row.r3 || 0}</td>
            {#if data[0].r4}
            <td>{row.r4 || 0}</td>
            {/if}
            <td>{row.ro16 || 0}</td>
            <td>{row.qf || 0}</td>
            <td>{row.sf || 0}</td>
            <td>{row.fn || 0}</td>
            <td>{row.tot}</td> 
        </tr>
        {/each}
    </tbody>
</table>
<style>
    th{
        background:var(--bg-color);
    }
    th:hover{
        cursor: pointer;
    }
    tr:nth-of-type(2n){
        background:rgba(0,0,0,0.25);
    }
    tr:hover{
        background:rgba(255,255,255,0.3);
    }
    thead{
        position:sticky;
        top:0;
        background:inherit;
    }
    table{
        background:inherit;
    }
    td > span{
        border-radius: 0.25rem;
    }
</style>