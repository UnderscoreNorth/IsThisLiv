<script>
    export let imgs
</script>
<div id='images'>
    {#await imgs}
        <h3>Loading</h3>
    {:then imgs}
        {#each imgs as img}
        <div>
            <a target='_blank' href='https://isthisliv.com/booru/post/{img.id}' auto>Post #{img.id}</a><br>
            {#if img.type == 'image'}
            <img src='https://isthisliv.com/booru/{img.thumbnailUrl}' alt='Booru Post {img.id}'/>
            {:else if img.mimeType == 'image/gif'}
            <img src='https://isthisliv.com/booru/{img.contentUrl}' alt='Booru Post {img.id}'/>
            {:else if img.type=='video'}
            <!-- svelte-ignore a11y-media-has-caption -->
            <video src='https://isthisliv.com/booru/{img.contentUrl}' alt='Booru Post {img.id}' controls/>
            {/if}
        </div>
        {/each}
    {/await}
</div>
<style>
#images{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
}
#images img,#images video{
    max-height:200px;
    max-width: 200px;
}
#images div{
    text-align: center;
}
</style>