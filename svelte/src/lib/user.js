import { writable } from 'svelte/store';
export const User = writable({
	user: '',
	accesstoken: '',
	refreshtoken: '',
	expiry: '',
	access: 0,
	init: false
});
export const LocalTime = writable(false)