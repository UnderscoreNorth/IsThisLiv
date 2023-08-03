import DB from "../../lib/db.js";
import dayjs from "dayjs";
export default class groupStage {
  static save = async (req, res, next) => {
    const body = req.body;
    let groups = {};
    let matches = [];
    let cup = await DB.query("SELECT * FROM `CupDB` WHERE iID = ?", [body.cup]);
    cup = cup[0];
    for (let i in body) {
      let team = body[i];
      if (i.length == 2) {
        let group = i.substring(0, 1);
        let pot = i.substring(1);
        groups[group] = groups[group] || [];
        groups[group][pot] = team;
      }
    }
    if (body.type == "32 Team Rotated Schedule") {
      let orders = ["ABCDEFGH", "BCDAFGHE", "CDABGHEF"];
      for (let round in orders) {
        let order = orders[round].split("");
        for (let letter of order) {
          let group = groups[letter];
          if (round == 0) {
            matches.push([letter, group[0], group[2]]);
            matches.push([letter, group[1], group[3]]);
          } else if (round == 1) {
            matches.push([letter, group[0], group[1]]);
            matches.push([letter, group[2], group[3]]);
          } else {
            matches.push([letter, group[1], group[2]]);
            matches.push([letter, group[3], group[0]]);
          }
        }
      }
      let dayCounter = 0;
      let currentDate = new dayjs(cup.dStart);
      for (let match of matches) {
        let matchtime = currentDate.add(dayCounter * 40 + 1020, "minute");
        await DB.query(
          `INSERT INTO MatchDB (iCupID,sRound,sHomeTeam,sAwayTeam,dUTCTime,sWinningTeam,iEnd,iAttendence,sStadium,bVoided,bComplete,sUser,iPes) VALUES (?,?,?,?,?,'',0,0,'',0,0,'',?)`,
          [
            body.cup,
            "Group " + match[0],
            match[1],
            match[2],
            matchtime.format("YYYY-MM-DD HH:mm:ss"),
            cup.iPes,
          ]
        );
        dayCounter++;
        if (dayCounter > 7) {
          dayCounter = 0;
          currentDate = currentDate.add(1, "day");
          if (currentDate.day() == 1) {
            currentDate = currentDate.add(4, "day");
          }
        }
      }
    }
    res.send();
  };
}
