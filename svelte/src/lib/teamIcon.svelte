<script lang='ts'>
    export let team:string;
</script>
{#if team !== 'draw' && team.length > 0}
<img class='teamIcon' src='/icons/team-small/38px-{team[0].toUpperCase() + team.substring(1).toLowerCase()}_icon.png' alt='{team}' />
{/if}