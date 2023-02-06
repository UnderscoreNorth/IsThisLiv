<svelte:head>
    <title>4CC Managers</title>
</svelte:head>
<script>
    import { page, } from "$app/stores";
    import config from '$lib/config.json';
    let filter = 'All';
    const api = config.api;
    let sort = '';
    const loadData = async(sort)=>{
        const response = await fetch(`${api}api/managers`,{
            method:'post',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body:JSON.stringify({
                sort
            })
        }).catch((err)=>{
           return ''; 
        });     
        let result = await response.json();
        return result;
    }
    page.subscribe((r)=>{
        sort = r.params.slug;
    })
    
</script>
<div id='managerContainer'>
    <div id='filters'>
        Sort by |
        <a href='/managers/days'>Total Days</a> |
        <a href='/managers/start'>Start Date</a> |
        <a href='/managers/end'>End Date</a> |
        <a href='/managers/board'>Board</a> |
        <a href='/managers/eff'>Efficiency</a> |
        <a href='/managers/points'>Avg Pts</a> |
        Filter by |
        <input type='radio' bind:group={filter} name='filter' value='All' checked /> All |
        <input type='radio' bind:group={filter} name='filter' value='Active' /> Active |
        <input type='radio' bind:group={filter} name='filter' value='Inactive' /> Inactive
    </div>
    {#await loadData(sort)}
        Loading...
    {:then data} 
        <div id='tableContainer'>
        <table style='border-collapse:collapse'>
            <thead>
                <tr>
                        <th colspan="2">
                            Manager
                        </th>
                    {#each Array(data.max) as _}
                        <th>Board</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>#</th>
                    {/each}
                        <th>Total Days</th>
                    {#if (sort == 'points' || sort == 'eff')}
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th>T</th>
                    <th>Eff</th>
                    <th>Avg Pts</th>
                    {/if}
                </tr>
            </thead>
            <tbody>
                {#each data.rowData as row,i}
                {#if (!(filter == 'Active' && !row.active)&&!(filter == 'Inactive' && row.active))}
                <tr>
                    <td>{i+1}</td>
                    <th>{row.manager}</th>
                    {#each Array(data.max) as _,j}
                        {#if row.runs[j]}
                            <td style='color:black;background:{row.runs[j].colour}'>/{row.runs[j].board}/</td>
                            <td style='color:black;background:{row.runs[j].colour}'>{row.runs[j].start}</td>
                            <td style='color:black;background:{row.runs[j].colour}'>{row.runs[j].end}</td>
                            <th style='color:black;background:{row.runs[j].colour}'>{row.runs[j].days}</th>
                        {:else}
                            <td colspan=4></td>
                        {/if}
                    {/each}
                    <th>{row.tot}</th>
                    {#if (sort == 'points' || sort == 'eff')}
                    <td>{row.w}</td>
                    <td>{row.d}</td>
                    <td>{row.l}</td>
                    <td>{row.w + row.d + row.l}</td>
                    <td>{row.e}%</td>
                    <td>{row.pts}</td>
                    {/if}
                </tr>
                {/if}
                {/each}
            </tbody>
        </table>
    </div>
    {/await}
</div>
<style>
    #managerContainer{
        height:100%;
    }
    thead{
        position:sticky;
        top:0;
        background:var(--bg-color);
    }
    #filters{
        background:var(--bg-color);
        padding:0.5rem 1rem;
        height:1rem;
        width:calc(100% - 2rem);
    }
    #tableContainer{
        width:100%;
        height:calc(100% - 2rem);
        overflow-x: scroll;
    }
    th,td{
        border-bottom: 1px solid rgba(100,100,100,0.5);
        padding: 2px 5px;
    }
</style>