<script lang='ts'>
    export let res:Record<string,Record<
			string,
			{
				header: Array<{ header: string; colspan?: number }>;
				rows: Array<Array<string>>;
				numbered: boolean;
			}
		>>;
</script>
{#each Object.entries(res) as [title,data]}
    <h3>{title}<hr/></h3>
    {#each Object.entries(data) as [name,table]}
        <div class='recordContainer'>
            <h4>{name}</h4>
            <table>
                <tr>
                    {#if table.numbered}
                    <th></th>
                    {/if}
                    {#each table.header as header}
                        <th colspan={header.colspan ? header.colspan : 1}>{header.header}</th>
                    {/each}
                </tr>
                {#each table.rows as row,i}
                <tr>
                    {#if table.numbered}
                    <td>{i+1}</td>
                    {/if}
                    {#each row as cell}
                    <td style:text-align={parseFloat(cell).toString() == cell ? 'right' : (cell.includes('> - <') ? 'center' : 'left')}>{@html cell.toString().replace('/icons/cups/','/icons/cups-small/')}</td>
                    {/each}
                </tr>
                {/each}
            </table>
        </div>
    {/each}
{/each}
<style>
    td{
        white-space:nowrap;
        text-overflow: ellipsis;
        overflow:hidden;
    }
</style>