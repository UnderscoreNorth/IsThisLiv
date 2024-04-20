import { api } from '$lib/helper';
import { User } from '$lib/user.js';

export async function load({ fetch, params }) {
	if (typeof localStorage !== 'undefined') {
		try {
			let data = localStorage.getItem('user');
			if (typeof data == 'string') {
				let res = await api('/sql/user/logintoken', {
					token: JSON.parse(data)
				});
				if (res.user) {
					User.set(res);
					localStorage.setItem('user', JSON.stringify(res));
				}
			}
		} catch (error) {
			localStorage.removeItem('user');
		}
	}
	User.update((u) => {
		u.init = true;
		return u;
	});
}
