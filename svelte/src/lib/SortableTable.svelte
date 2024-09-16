<script lang="ts">
	export let data: Array<Record<string,{id:string,name:string,class:string,style:string,value:string | number}>>;
	export let defaultSort: string;
	let sortAsc = true;
	let sortField = defaultSort;
	const sort = (field: string) => {
		if (field == sortField) {
			sortAsc = !sortAsc;
		} else {
			sortAsc = true;
			sortField = field;
		}
		data.sort((a, b) => {
			console.log(a, b);
			let res = 0;
			let af = a[field].value || -99999999;
			let bf = b[field].value || -99999999;
			if (parseFloat(af.toString())) af = parseFloat(af.toString());
			if (parseFloat(bf.toString())) bf = parseFloat(bf.toString());
			if (af > bf) {
				res = 1;
			} else if (af < bf) {
				res = -1;
			}
			if (!sortAsc) res *= -1;
			return res;
		});
		data = data;
	};
	sort(sortField);
</script>

<table>
	<thead>
		<tr>
			<th>#</th>
			{#each Object.values(data[0]) as field}
				<th
					on:click={() => {
						sort(field.id);
					}}>{field.name}</th
				>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each data as row, i}
			<tr>
				<td>{i + 1}</td>
				{#each Object.values(row) as field}
					<td><span class={field.class} style={field.style}>{field.value}</span></td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>

<style>
	th {
		background: var(--bg-color);
	}
	th:hover {
		cursor: pointer;
	}
	tr:nth-of-type(2n) {
		background: rgba(0, 0, 0, 0.25);
	}
	tr:hover {
		background: rgba(255, 255, 255, 0.3);
	}
	thead {
		position: sticky;
		top: 0;
		background: inherit;
	}
	table {
		background: inherit;
	}
	td > span {
		border-radius: 0.25rem;
	}
</style>
