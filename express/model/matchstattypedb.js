import _default from "./default.js";
export default class {
  static tableName = "matchstattypedb";
  static mapping = {
    iMatchStatType: { primary: true, link: true },
    sDescription: {},
  };
}
