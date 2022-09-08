<svelte:head>
    <title>Cups - IsThisLiv</title>
</svelte:head>
<script>
    import config from '../../config.json';
    /**
     * @param {object} api
     */
    let api = config.api;
    let data = (async()=>{
        const response = await fetch(`${api}api/cups`);
        return await response.json();
    })();
</script>
<div class='p-1'>
    <h1>Cup Stats</h1>
    {#await data}
    <p>Loading...</p>
    {:then data}
    <p>Click on a header to sort</p>
    <table>
        <thead>
            <tr>
                <th>Cup</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Teams</th>
                <th>Matches</th>
                <th>Champion</th>
                <th>Runner-Up</th>
                <th>Third</th>
                <th>Fourth</th>
                <th>Matches</th>
                <th>E.T. Matches</th>
                <th>Penalties</th>
                <th>Goals Scored</th>
                <th>GPM</th>
                <th>Golden Boot</th>
                <th>Golden Ball</th>
                <th>Golden Glove</th>
                <th>Yellow Cards</th>
                <th>Red Cards</th>
            </tr>
        </thead>
        <tbody>
            {#each data as row}
                <tr>
                    {#each row as cell}
                        <td>{@html cell}</td>
                    {/each}
                </tr>
            {/each}
        </tbody>
    </table>
    {/await}
</div>
