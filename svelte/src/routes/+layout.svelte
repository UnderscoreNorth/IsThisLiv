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
    import MdPerson from 'svelte-icons/md/MdPerson.svelte';
    import UserModal from '$lib/userModal.svelte';
    import { User } from '$lib/user';

    const links = [
        ['/','IsThisLiv'],
        ['/cups','Cups'],
        ['/teams','Teams'],
        ['/players','Players'],
        ['/records','Records'],
        ['/misc','Misc Stats'],
        ['/ff','Fantasy Football'],
    ]
    let loginFlag = false;
    let loggedIn = false;
    function toggleDarkMode(){
        localStorage.setItem('theme',document.documentElement.classList.toggle('dark-mode') ? '1' : '0');
    }
    function toggleLogin(){
        loginFlag = !loginFlag;
    }
    if(typeof localStorage !== 'undefined')
        $User.username = localStorage.getItem('username') || '';
</script>

<nav id='Nav'>
    {#each links as link}
        <a  
            href='{link[0]}' class='{
            link[0] == '/' 
                ? ($page.url.pathname ==link[0]
                    ? 'selected' 
                    : '')
                : ($page.url.pathname.includes(link[0]) 
                    ? 'selected' 
                    : '')}'>
        {link[1]}</a>
    {/each}
    <div id='rightNav' style='float:right'>
        <icon on:click={toggleLogin}><MdPerson /></icon>
        <button on:click={toggleDarkMode}>Dark Mode</button>
        
    </div>
</nav>
{#if loginFlag}
    <UserModal/>
{/if}
<div style='height:calc(100% - 2.5rem)'>
    <slot>

    </slot>
</div>
<style>
    :global(html){
        font-family:"Helvetica";
        --bg-color:#f6f6f6;
        --bg-c1:#dde2e7;
        --bg-c2:#dadfe7;
        --fg-color:black;
        background-color: var(--bg-color);
        color:var(--fg-color);
        height:100%;
    }
    :global(body > div){
        height:100%;
    }
    :global(html.dark-mode){
        --bg-color: #151f27;
        --bg-c1:#3a4050;
        --bg-c2:#5d6477;
		--fg-color: #d9dbdf;
    }
    :global(body){
        margin:0;
        position:relative;
        height:100%;
    }
    :global(td){
        padding:0 0.5rem;
        text-align:right;
    }
    :global(a){
        color:var(--fg-color);
        text-decoration:none;
    }
    :global(a:hover){
        background:#2E51A2;
        border-radius:3px;
        color:white;
        padding:0.1rem;
        margin:-0.1rem;
    }
    :global(.c-1){
        background:var(--bg-c1);
    }
    :global(.c-2){
        background:var(--bg-c2);
    }
    :global(vertNav){
        display:flex;
        position:sticky;
        top:3.5rem;
        height:calc(100% - 2rem);
        flex-direction:column;
        padding:1rem;
    }
    :global(.status-win){
        background:#ddffdd;
    }
    :global(.status-win > a){
        color:black!important;
    }
    :global(.p-1){
        padding:1rem;
    }
    :global(.Gold){
        background:#E0C068;
        color:black;
        padding:0 0.5rem;
    }
    :global(.Silver){
        background:#B7BEC5;
        color:black;
        padding:0 0.5rem;
    }
    :global(.Bronze){
        background:#964a3c;
        color:black;
        padding:0 0.5rem;
    }
    :global(.W){
        background:#ddffdd;
        color:black;
    }
    :global(.D){
        background:#ffffdd;
        color:black;
    }
    :global(.L){
        background:#ffdddd;
        color:black;
    }
    :global(.V){
        background:#ccc;
        color:black;
    }
    nav{
        background:#2E51A2;
        font-size:15px;
        height:2.5rem;
        color:white;
        line-height: 2.5rem;
        padding-left:1.25rem;
    }
    nav a, nav button{
        color:white;
        padding:0 0.5rem!important;
        margin:0!important;
        text-decoration: none;
        min-height: 2.5rem;
        display:inline-block;
    }
    nav button{
        background:none;
        border:none;
        cursor:pointer;
    }
    nav icon{
        height:2rem;
        width:2rem;
        display:block;
        cursor:pointer;
        border-radius:0.25rem;
        padding:0.25rem;
    }
    nav a:hover, nav button:hover, nav icon:hover{
        background:#3a4050;
        border-radius:0;

    }
    #rightNav *{
        float:right;
    }
    nav .selected{
        background:white;
        color:#2E51A2;
        font-weight:bold;
    }
</style>