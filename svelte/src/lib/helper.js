export function teamLink(team) {
	if (team != 'draw') {
		if (team) {
			return `<a href='/teams/${team}'>/${team}/</a>`;
		} else {
			return 'TBD';
		}
	} else {
		return team;
	}
}
