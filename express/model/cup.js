import _default from "./default.js";
export default class {
  static tableName = "cupdb";
  static mapping = {
    iCupID: {
      primary: true,
      link: true,
    },
    sName: {},
    sSeason: {},
    iYear: {},
    iCupType: {
      link: true,
    },
    dStart: {},
    dEnd: {},
    iRankPoints: {},
    sUser: {},
    iPes: {},
  };
}
