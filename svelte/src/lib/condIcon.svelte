<script lang='ts'>
    export let cond:1|2|3|4|5;
</script>
{#if cond >= 1}
    <img class='condIcon' src='/icons/Cond{cond}.png' alt='Condition {cond}'/>
{/if}
<style>
    .condIcon{
        height:13px;
    }
</style>