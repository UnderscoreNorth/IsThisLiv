import DB from "../lib/db";
export default class {
  static getOfficialCups = async () => {
    return await DB.query(
      "SELECT * FROM `CupDB` WHERE iType <= 4 ORDER BY dStart DESC",
      ""
    );
  };
  static getTeamsInCup = async (cupID) => {
    return await DB.query(
      `SELECT COUNT(DISTINCT(sTeam)) AS c
    FROM 
    (
        SELECT DISTINCT(sHomeTeam) AS sTeam
        FROM MatchDB
        WHERE iCupID =?
        AND bOfficial = 1
        UNION
        SELECT DISTINCT(sAwayTeam) AS sTeam
        FROM MatchDB
        WHERE iCupID =?
        AND bOfficial = 1
    ) t
    `,
      [cupID, cupID]
    );
  };
  static upsert = async () => {};
}
