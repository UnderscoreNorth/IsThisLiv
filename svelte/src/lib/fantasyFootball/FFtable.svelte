<script lang="ts">
	import SortableTable from '$lib/SortableTable.svelte';
	export let data: Array<any>;
	let tempData = [];
	const headers = [
		'player',
		'team',
		'tot',
		'r1',
		'r2',
		'r3',
		'r4',
		'ro16',
		'qf',
		'sf',
		'fn',
		'tot'
	];
	for (let i = headers.length - 1; i >= 0; i--) {
		const header = headers[i];
		let exists = false;
		for (let row of data) {
			if (row[header]) {
				exists = true;
				break;
			}
		}
		if (!exists) {
			headers.splice(i, 1);
		}
	}

	for (let row of data) {
		let tempRow = {};
		for (let header of headers) {
			let obj = {
				id: '',
				name: '',
				style: '',
				class: '',
				value: ''
			};
			obj.id = header;
			obj.value = row[header] || '';
			obj.name = header;
			if (header == 'medal') {
				obj.class = row[header];
			}
			if (header == 'player') {
				obj.style = 'max-width:50rem';
			}
			tempRow[header] = obj;
		}
		tempData.push(tempRow);
	}
	data = tempData;
	console.log(data);
</script>

<SortableTable {data} defaultSort="tot" />
