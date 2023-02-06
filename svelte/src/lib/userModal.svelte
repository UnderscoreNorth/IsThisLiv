<script>
    import { User } from "./user";
    import config from '$lib/config.json';
    const api = config.api;
    let inputUser = '';
    let inputPass = '';
    const login = async()=>{
        const response = await fetch(`${api}api/login`,{
            method:'post',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body:JSON.stringify({
                inputUser,
                inputPass
            })
        });     
        let result = await response.json();
        if(result.username){
            localStorage.setItem('username',result.username);
            User.set({
                username:result.username,
                accesstoken:'',
                refreshtoken:'',
                expiry:''
            });
        }
    }
    const logout = ()=>{
        User.set({
            username:'',
            accesstoken:'',
            refreshtoken:'',
            expiry:''
        });
    }
</script>
<modal class='c-1'>
    {#if $User.username}
        {$User.username}
        <hr>
        <button on:click={logout}>Logout</button>
    {:else}
    <input placeholder='Username' bind:value={inputUser}>
    <input placeholder='Password' bind:value={inputPass} type='password'>
    <hr>
    <button on:click={login}>Login</button>
    {/if}
    
</modal>
<style>
    modal{
        position:absolute;
        right:2rem;
        top:2.5rem;
        width:10rem;
        padding:1rem;
        z-index: 1;
    }
    input{
        width:calc(100% - 0.5rem);
        padding:0.25rem;
        border:0;
        margin-bottom:0.25rem;
    }
    button{
        width:100%;
    }
</style>