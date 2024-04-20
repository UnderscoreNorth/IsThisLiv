import { api } from '$lib/helper';

export async function load({ fetch, params }) {
	return { rows: await api('/cups/list') };
}
