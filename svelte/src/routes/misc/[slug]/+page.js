import config from '../../../lib/config.json';
let api = config.api;
export async function load({ fetch, params }) {
	return fetch(`${api}api/misc/` + params.slug).then((result) => {
		return result.json();
	});
}
