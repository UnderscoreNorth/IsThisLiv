import _default from "./default.js";
export default class {
  static tableName = "eventdb";
  static mapping = {
    iEventID: {
      primary: true,
      link: true,
    },
    iMatchID: {
      link: true,
    },
    iPlayerID: {
      link: true,
    },
    iEventType: {
      link: true,
    },
    dRegTime: {},
    dInjTime: {},
    sUser: {},
  };
}
