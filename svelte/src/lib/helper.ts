import CONFIG from '$lib/config.json'
export function cupShort(cupName:string) {
  let cupWords = cupName.split(" ");
  let shortName = "";
  for (let cupWord of cupWords) {
    if (parseInt(cupWord) && parseInt(cupWord) > 2000) {
      shortName += cupWord + " ";
    } else if (cupWord != "4chan") {
      shortName += cupWord[0];
    }
  }
  return shortName;
}
export function cupToBooru(cupName:string) {
  let words = cupName.split(" ");
  return words[0] + "_" + words[2];
}
export async function api(url: string, body?: object) {
	return await fetch(
		`${CONFIG.api}${url}`,
		body == undefined
			? {}
			: {
					method: 'post',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(body)
			  }
	).then(async (result) => {
		return await result.json();
	});
}

export async function getBooru(tag:string) {
  return await fetch(`${CONFIG.booru}/api/posts/?query=${tag}`, {
    method: "get",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  }).then(async (result) => {
    return (await result.json()).results;
  });
}

