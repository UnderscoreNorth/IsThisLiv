import _default from "./default.js";
export default class {
  static tableName = "performancedb";
  static mapping = {
    iPerformanceID: {
      primary: true,
      link: true,
    },
    iMatchID: {
      link: true,
    },
    iSubOn: {},
    iSubOff: {},
    dRating: {},
    iSaves: {},
    bMotM: {},
    iPlayerID: { link: true },
    sUser: {},
    iCond: {},
    iFF: {},
  };
}
