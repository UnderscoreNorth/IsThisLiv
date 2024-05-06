import { writable } from 'svelte/store';
export const ffStore = writable<{name:string;starting:Set<number>,bench:Set<number>,cupID:number,teamID:number,cap:number,vice:number,required:number[],groupsFormation:any}>({
	starting: new Set(),
	bench: new Set(),
	cupID: 0,
	teamID:0,
	cap:0,
	vice:0,
	name:'',
	required:[],
	groupsFormation:{DEF:0,MID:0,FWD:0}
});