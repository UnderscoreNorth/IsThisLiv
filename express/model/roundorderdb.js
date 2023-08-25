import _default from "./default.js";
export default class {
  static tableName = "roundorderdb";
  static mapping = {
    sRound: {
      primary: true,
      link: true,
    },
    iOrder: {},
  };
}
