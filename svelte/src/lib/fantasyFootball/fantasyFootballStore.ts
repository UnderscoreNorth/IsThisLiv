import { writable } from 'svelte/store';
export const ffStore = writable({
	starting: [],
	bench: [],
	cupID: 0
});
