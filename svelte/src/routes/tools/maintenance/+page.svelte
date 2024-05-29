<script>
	import {api } from "$lib/helper";

    const data = api('/sql/getMaintenance');
</script>
<div style='padding:2rem'>
    {#await data then data}        
       {@html data.html}
    {/await}
</div>
<style>
</style>