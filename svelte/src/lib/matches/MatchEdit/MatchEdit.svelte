<script lang='ts'>
	import { api } from '$lib/constants';
	export let matchID:number;
	import Modal from '$lib/modal.svelte';
	import MatchEditData from './MatchEditData.svelte';
	function close() {
		matchID = 0;
	}
	let data = (async () => {
		let returnObject = await api('/sql/matchDisplay/' + matchID);
		returnObject.matchID = matchID;
		let tzOffset = new Date().getTimezoneOffset() * 60000;
		returnObject.date = new Date(returnObject.date);
		returnObject.date = new Date(returnObject.date - tzOffset).toISOString().replace('Z','');
		for(let i in returnObject.performances){
			for(let j = 0;j<15;j++){
				returnObject.performances[i][j] = returnObject.performances[i][j] || {player:{},performance:{}};
				if(returnObject.performances[i][j].bMotM){
					returnObject.motm = returnObject.performances[i][j].iPlayerID
				}
			}
		}
		console.log(returnObject);
		return returnObject;
	})();
</script>
<Modal close={close} title={'Match Edit'}>
	{#await data}
		Loading...
	{:then data}		
		<MatchEditData {data} {close} />
	{/await}
</Modal>

<style>
	
</style>
