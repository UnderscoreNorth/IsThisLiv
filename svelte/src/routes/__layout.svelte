<svelte:head>
    <script>
        if(document && typeof document !== 'undefined'){
            if(localStorage.getItem('theme') == '1')
                document.documentElement.classList.add('dark-mode')
        }
    </script>
</svelte:head>
<script>
    import { page } from '$app/stores';
    import {writable} from 'svelte/store';

    const links = [
        ['/','IsThisLiv'],
        ['/cups','Cups'],
        ['/teams','Teams'],
        ['/players','Players'],
        ['/records','Records'],
        ['/misc','Misc Stats'],
        ['/ff','Fantasy Football'],
        ['/info','Info'],
    ]
    function toggle(){
        localStorage.setItem('theme',document.documentElement.classList.toggle('dark-mode') ? '1' : '0');
    }
</script>


<nav>
    {#each links as link}
        <a href='{link[0]}' class='{
        link[0] == '/' 
        ? ($page.url.pathname ==link[0]
            ? 'selected' 
            : '')
        : ($page.url.pathname.includes(link[0]) 
            ? 'selected' 
            : '')}'>{link[1]}</a>
    {/each}
    <button on:click={toggle}>Dark Mode</button>
</nav>
<div style='padding:10px'>
    <slot>

    </slot>
</div>
<style>
    :global(body){
        font-family:"Helvetica";
        margin:0;
    }
    :global(html.dark-mode){
        background-color: #151f27;
		color: #d9dbdf;
    }
    :global(td){
        padding:0 10px;
        text-align:right;
    }
    :global(a){
        color:black;
        text-decoration:none;
    }
    :global(html.dark-mode a){
        color: #d9dbdf;
    }
    :global(a:hover){
        background:#2E51A2;
        border-radius:3px;
        color:white;
    }

    nav{
        background:#2E51A2;
        font-size:15px;
        height:40px;
        color:white;
        line-height: 40px;
        padding-left:20px;
    }
    nav a, nav button{
        color:white;
        padding:0 10px;
        text-decoration: none;
        min-height: 40px;
        display:inline-block;
    }
    nav button{
        background:none;
        border:none;
        float:right;
        cursor:pointer;
    }
    nav a:hover, nav button:hover{
        background:#3a4050;
        border-radius:0;

    }
    nav .selected{
        background:white;
        color:#2E51A2;
        font-weight:bold;
    }
</style>