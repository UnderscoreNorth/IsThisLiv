import {writable} from 'svelte/store';
export const User = writable({
    username:'',
    accesstoken:'',
    refreshtoken:'',
    expiry:''
});