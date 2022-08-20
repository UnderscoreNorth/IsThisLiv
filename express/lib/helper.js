import DB from '../lib/db.js';

export function teamLink(team){
    if(team != 'draw'){
		if(team){
			return `<a href='/teams/${team}'>/${team}/</a>`;
		} else {
			return "TBD";
		}
	} else {
		return team;
	}
}
export async function cupLink(cupID){
	let cup = await DB.query('SELECT * FROM `CupDB` WHERE iID=?',[cupID]);
	cup = cup[0];
	let cupShortName = cup.iYear + '-' + cup.sSeason[0] + (cup.iType == 1 ? '' : (cup.iType == 2 ? 'B' : (cup.iType == 3 ? 'Q' : 'F'))) + 'C';
	return `<a href='/cups/${cupID}-${cupShortName}'>${cup.sName}</a>`;
}

export const pageExpiry = 86400000;