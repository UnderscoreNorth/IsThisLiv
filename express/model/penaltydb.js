import _default from "./default.js";
export default class {
  static tableName = "penaltydb";
  static mapping = {
    iPenaltyID: {
      primary: true,
      link: true,
    },
    iMatchID: {
      link: true,
    },
    iPlayerID: {
      link: true,
    },
    bGoal: {},
    sUser: {},
  };
}
