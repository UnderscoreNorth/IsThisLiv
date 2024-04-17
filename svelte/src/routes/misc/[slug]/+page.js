import { api } from '$lib/constants';

export async function load({ fetch, params }) {
	return api('/misc/' + params.slug);
}
