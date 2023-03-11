import config from '../../../lib/config.json';
let api = config.api;
export async function load({ fetch, params }) {
	const res = await fetch(`${api}api/cups/` + params.slug);
	const item = await res.json();
	return item;
}
