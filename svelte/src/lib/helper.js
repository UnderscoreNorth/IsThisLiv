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
export function cupShort(cupName) {
	let cupWords = cupName.split(' ');
	let shortName = '';
	for (let cupWord of cupWords) {
		if (parseInt(cupWord) && cupWord > 2000) {
			shortName += cupWord + ' ';
		} else if (cupWord != '4chan') {
			shortName += cupWord[0];
		}
	}
	return shortName;
}
