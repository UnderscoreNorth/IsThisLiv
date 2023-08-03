import config from '$lib/config.json';
let api = config.api;
export async function load({ fetch, params }) {
	const res = await fetch(`${api}api/list/cups`);
	const item = await res.json();
	return { rows: item };
}
