<script lang='ts'>
	import type { Moment } from "moment";
    import { LocalTime } from "./user";
	import moment from "moment";
    export let date:Date;
	export let multiline=true;
	let datetime = moment.utc(date)
    function formatDate(m:Moment){
		return m.format('D/MM/YYYY')
	}
	function formatTime(m:Moment){
		return m.format('HH:mm:ss')
	}
</script>
{$LocalTime ? formatDate(datetime.clone().local()) : formatDate(datetime)}
{#if multiline}<br />{/if}
{$LocalTime ? formatTime(datetime.clone().local()) : formatTime(datetime)}