import DB from "../../lib/db.js";
import fs from "fs";
export default class editFile {
  static process = async (req, res, next) => {
    //console.log(5, Object.keys(req.files.file[0]));
    let file = req.files.file[0];
    let content = fs.readFileSync(file.path, "utf8");
    for (let row of content.split(/\r?\n/)) {
      console.log(row);
      break;
    }
    fs.unlink(file.path, () => {});
  };
  static save = async (req, res, next) => {};
}
