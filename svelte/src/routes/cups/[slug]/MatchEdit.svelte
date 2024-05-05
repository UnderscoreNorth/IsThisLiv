<script lang='ts'>
	import { api } from '$lib/helper';
	export let matchID:number;
	import Modal from '$lib/modal.svelte';
	import MatchEditData from './MatchEditData.svelte';
	function close() {
		location.reload()
	}
	async function getData(){
		let returnObject = await api('/sql/matchDisplay/' + matchID);
		returnObject.matchID = matchID;
		let tzOffset = new Date().getTimezoneOffset() * 60000;
		returnObject.date = new Date(new Date(returnObject.date).getTime() + tzOffset);
		for(let i in returnObject.performances){
			for(let j = 0;j<15;j++){
				returnObject.performances[i][j] = returnObject.performances[i][j] || {player:{},performance:{subOn:0,subOff:90}};
				if(returnObject.performances[i][j].bMotM){
					returnObject.motm = returnObject.performances[i][j].iPlayerID
				}
			}
		}
		return returnObject;
	}
	let data = getData();
</script>
<Modal close={close} title={'Match Edit'}>
	{#await data}
		Loading...
	{:then data}		
		<MatchEditData {data} {close} {getData}/>
	{/await}
</Modal>

<style>
	
</style>
