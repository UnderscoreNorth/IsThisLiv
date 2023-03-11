import config from '../../../lib/config.json';
let api = config.api;
export async function load({ fetch, params }) {
	const res = await fetch(`${api}api/misc/` + params.slug);
	const item = await res.json();
	return item;
}
