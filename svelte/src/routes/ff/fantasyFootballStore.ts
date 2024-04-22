import { writable } from 'svelte/store';
export const ffStore = writable<{name:string;starting:Set<number>,bench:Set<number>,cupID:number,teamID:number,cap:number,vice:number}>({
	starting: new Set(),
	bench: new Set(),
	cupID: 0,
	teamID:0,
	cap:0,
	vice:0,
	name:''
});