import _default from "./default.js";
export default class {
  static tableName = "cuptypelookup";
  static mapping = {
    iCupType: {
      primary: true,
      link: true,
    },
    sDescription: {},
  };
}
