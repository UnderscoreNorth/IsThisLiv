import _default from "./default.js";
export default class {
  static tableName = "rosterorderdb";
  static mapping = {
    sRegPos: {
      primary: true,
      link: true,
    },
    iOrder: {},
    iPosType: {},
  };
}
