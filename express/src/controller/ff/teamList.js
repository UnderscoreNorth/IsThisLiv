import DB from "../../src/lib/db.js";
export default async function main(req, res, next) {
  const cupID = req.body.cupID;
  let result = await DB.query(
    `
  SELECT 
    sName
  FROM
    FantasyDB
  WHERE
    iCupID=?
  ORDER BY    
      sName`,
    [cupID]
  );
  let arr = [];
  for (let row of Object.values(result)) {
    arr.push(row.sName);
  }
  res.send(arr);
}
