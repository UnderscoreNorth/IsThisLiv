import _default from "./default.js";
export default class {
  static tableName = "teammeta";
  static mapping = {
    sTeam: {
      primary: true,
      link: true,
    },
    sPrimaryHex: {},
  };
}
