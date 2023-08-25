import _default from "./default.js";
export default class {
  static tableName = "matchdb";
  static mapping = {
    iMatchID: {
      primary: true,
      link: true,
    },
    iCupID: {
      link: true,
    },
    sRound: {
      link: true,
    },
    sHomeTeam: {},
    sAwayTeam: {},
    sWinningTeam: {},
    iEndType: {},
    dUTCTime: {},
    iAttendance: {},
    bVoided: {},
    bComplete: {},
    bOfficial: {},
    iPes: {},
    sUser: {},
    sStadium: {},
  };
}
