<script>
	import { api } from "$lib/helper";
	import { ffStore } from "./fantasyFootballStore";
    let signIn = {
        team:'',
        prv:''
    }
    let prv = '';
    let error = '';
    async function teamList(){
        return await api('/ff/teamList');
    }
    let disabled = false;
    async function login(){
        disabled = true;
        let res = await api('/ff/login',signIn);
        if(res.error){
            error = res.error;
        } else{
            error = '';
            prv = '';
            res.data.starting = new Set(res.data.starting);
            res.data.bench = new Set(res.data.bench);
            $ffStore = res.data;

        }
        disabled = false;
    }
    async function register(){
        disabled = true;
        let res = await api('/ff/register',signIn);
        if(res.error){
            error = res.error;
        } else{
            error = '';
            prv = res.prv;
        }
        disabled = false;
    }
</script>
<div id="ffTeamLogin">
    {#await teamList() then data}
    {#if error.length}<div id='error'>Error: {error}</div>{/if}
    {#if prv}<div>Your passcode is <b>{prv}</b>, use it to sign in.</div>{/if}
    <input bind:value={signIn.team} placeholder="Fantasy Team Name" list="teamNames" /><br />
    <input
        bind:value={signIn.prv}
        placeholder="Private Key (for existing teams)"
        type="password"
    /><br />
    <datalist id="teamNames">
        {#each data as team}
            <option value={team} />
        {/each}
    </datalist>
    <button disabled={disabled} on:click={login}>Login</button><button disabled={disabled} on:click={register}>Register</button>    
    {/await}
    
</div>
<style>
    #error{
        margin-bottom: 5px;
        background:#A00;
        padding:5px;
    }
	#ffTeamLogin {
		width: 30rem;
        margin-top:4rem;
		padding: 0.5rem;
	}
	#ffTeamLogin input {
		width: calc(100% - 1rem);
		padding: 0.5rem;
		margin-bottom: 0.5rem;
	}
	#ffTeamLogin button {
		padding: 0.5rem;
		margin-right: 0.5rem;
	}
</style>
