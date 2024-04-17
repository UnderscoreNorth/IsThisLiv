/*static edit = async (req, res, next) => {
    let result = {};
    let data = req.body;
    let rankPoints = 0;
    if (data.type == 1) {
      rankPoints = 21;
    } else if (data.type == 2) {
      rankPoints = 19;
    } else if (data.type == 2.5) {
      rankPoints = 21;
      data.type = 2;
    }
    let query = `INSERT INTO CupDB (sName,sSeason,iYear,iType,dStart,dEnd,iRankPoints,sUser,iPes) VALUES
    (?,?,?,?,?,?,?,?,?)`;
    await DB.query(query, [
      data.name,
      data.season,
      data.year,
      data.type,
      data.start,
      data.finish,
      rankPoints,
      data.user,
      data.version,
    ]);
    let cupID = await DB.query(
      `SELECT iCupID FROM CupDB ORDER BY iCupID DESC LIMIT 1`
    );
    cupID = cupID[0].iCupID;
    result.cupID = cupID;
    result.cupURL = `${cupID}-${cupShort(data.name).replace(" ", "-")}`;
    res.send(result);
  };
}
*/
