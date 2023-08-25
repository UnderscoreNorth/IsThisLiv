import _default from "./default.js";
export default class {
  static tableName = "playerlinkdb";
  static mapping = {
    iPlayerLinkID: {
      primary: true,
      link: true,
    },
    sTeam: {
      link: true,
    },
    sName: {},
  };
}
