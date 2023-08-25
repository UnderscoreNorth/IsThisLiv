import _default from "./default.js";
export default class {
  static tableName = "eventtypedb";
  static mapping = {
    iEventType: {
      primary: true,
      link: true,
    },
    sDescription: {},
  };
  goalTypes = [1, 3, 4];
  ownGoalType = [3];
  goalsForType = [1, 4];
  cardTypes = [5, 6, 8];
}
