<script>
	import TeamIcon from "./teamIcon.svelte";

    export let match;
</script>

<div style:font-weight={match.home == match.winner ? 'bold' : 'normal'}><TeamIcon team={match.home}/>/{match.home}/</div>
<div style:font-weight={match.home == match.winner ? 'bold' : 'normal'}>{match.homeg}</div>
<div style:font-weight={match.away == match.winner ? 'bold' : 'normal'}><TeamIcon team={match.away}/>/{match.away}/</div>
<div style:font-weight={match.away == match.winner ? 'bold' : 'normal'}>{match.awayg}</div>
<style>
    div{
        border:solid 1px var(--fg-color);
        padding:0.25rem;
        background:var(--bg-c1);
    }
</style>