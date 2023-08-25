import _default from "./default.js";
export default class {
  static tableName = "playerdb";
  static mapping = {
    iPlayerID: {
      primary: true,
      link: true,
    },
    iCupID: {
      link: true,
    },
    sTeam: {
      link: true,
    },
    sName: {},
    sMedal: {},
    bCaptain: {},
    sRegPos: { link: true },
    iShirtNumber: {},
    bStarting: {},
    iLink: {},
    sUser: {},
    iPesID: {},
  };
}
