<script lang='ts'>
    export let eventType:1|2|3|4|5|6;
    const mapping = {
        1:'Goal.png',
        2:'Assist.png',
        3:'Owngoal.png',
        4:'Goal.png',
        5:'Yellowcard.png',
        6:'Redcard.png'
    }
</script>
{#if eventType <= 6}
<img class='eventIcon' src='/icons/{mapping[eventType]}' alt={mapping[eventType]}/>
{:else}
<span class='doubleYellowCard'>
<img class='eventIcon' src='/icons/{mapping[5]}' alt={mapping[5]}/>
<img class='eventIcon' src='/icons/{mapping[5]}' alt={mapping[5]}/>
<img class='eventIcon' src='/icons/{mapping[6]}' alt={mapping[6]}/>
</span>
{/if}
<style>
    .doubleYellowCard img:nth-child(2){
        margin-left:-10px;
    }
    .doubleYellowCard img:nth-child(3){
        margin-left:-10px;
    }
</style>