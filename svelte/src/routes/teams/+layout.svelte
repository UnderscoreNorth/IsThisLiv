<script>
	import { page } from '$app/stores';
	import { DeepSet } from '$lib/deepSet';
	import SideBar from '$lib/sideBar.svelte';
	const links = [
		'3',
		'a',
		'aco',
		'adv',
		'an',
		'asp',
		'b',
		'bant',
		'biz',
		'c',
		'cgl',
		'ck',
		'cm',
		'co',
		'd',
		'diy',
		'e',
		'f',
		'fa',
		'fit',
		'g',
		'gd',
		'gif',
		'h',
		'his',
		'hm',
		'hr',
		'i',
		'ic',
		'int',
		'jp',
		'k',
		'lgbt',
		'lit',
		'm',
		'mlp',
		'mu',
		'n',
		'o',
		'out',
		'p',
		'po',
		'pol',
		'pw',
		'r9k',
		's',
		's4s',
		'sci',
		'soc',
		'sp',
		't',
		'tg',
		'toy',
		'trv',
		'tv',
		'u',
		'v',
		'vg',
		'vm',
		'vmg',
		'vp',
		'vr',
		'vrpg',
		'vst',
		'vt',
		'w',
		'wg',
		'wsg',
		'x',
		'xs',
		'y'
	];
	const deepset = new DeepSet();
	for(const link of links){
		deepset.add([link,'/' + link + '/'])
	}
	const path = '/teams/';
</script>
<SideBar links={deepset} {path}>
	<div id="slotContainer">
	<slot/>
</div>
</SideBar>
<style>
	#slotContainer{
		padding:1rem;
		position:relative;
	}
</style>
