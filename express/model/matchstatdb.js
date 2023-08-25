import _default from "./default.js";
export default class {
  static tableName = "matchstatdb";
  static mapping = {
    iMatchStatID: {
      primary: true,
      link: true,
    },
    iMatchID: {
      link: true,
    },
    bHome: {},
    iMatchStatType: { link: true },
    bFinal: {},
    iPoss: {},
    iShots: {},
    iShotsOT: {},
    iFouls: {},
    iOFfsides: {},
    iFreeKicks: {},
    iPassComp: {},
    iPassMade: {},
    iCrosses: {},
    iInterceptions: {},
    iTackles: {},
    iSaves: {},
    iCorners: {},
    iPassTot: {},
    sTeam: {
      link: true,
    },
  };
}
