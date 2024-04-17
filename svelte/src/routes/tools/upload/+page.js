import { api } from '$lib/constants';

export async function load({ fetch, params }) {
	return { rows: await api('/cups/list') };
}
