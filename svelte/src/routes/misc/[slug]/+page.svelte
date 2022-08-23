<script>
    import config from '../../../config.json';
    import { page } from '$app/stores';
    let api = config.api;
    let data = (async()=>{
        const response = await fetch(`${api}api` + $page.url.pathname);
        return await response.json();
    })();
    
</script>
{#await data}
    Loading...
{:then data} 
    <container>
        {@html data.html}
    </container>
{:catch data}
    Something failed
{/await}

<style>
    container{
        display:block;
        padding:1rem;
        height:calc(100% - 2rem);
        overflow-y:scroll;
    }
</style>