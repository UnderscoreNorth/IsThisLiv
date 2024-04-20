export function teamLink(team) {
  if (team != "draw") {
    if (team) {
      return `<a href='/teams/${team}'>/${team}/</a>`;
    } else {
      return "TBD";
    }
  } else {
    return team;
  }
}
export function cupShort(cupName) {
  let cupWords = cupName.split(" ");
  let shortName = "";
  for (let cupWord of cupWords) {
    if (parseInt(cupWord) && cupWord > 2000) {
      shortName += cupWord + " ";
    } else if (cupWord != "4chan") {
      shortName += cupWord[0];
    }
  }
  return shortName;
}
export function cupToBooru(cupName) {
  let words = cupName.split(" ");
  return words[0] + "_" + words[2];
}
export async function getBooru(tag) {
  return await fetch(`https://isthisliv.com/booru/api/posts/?query=${tag}`, {
    method: "get",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  }).then(async (result) => {
    return (await result.json()).results;
  });
}

