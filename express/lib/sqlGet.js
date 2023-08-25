import db from "./db.js";
import cupdb from "../model/cup.js";
import cuptypelookup from "../model/cuptypelookup.js";
import eventdb from "../model/eventdb.js";
import eventtypelookup from "../model/eventtypelookup.js";
import matchdb from "../model/matchdb.js";
import matchstattypedb from "../model/matchstattypedb.js";
import matchstatdb from "../model/matchstatdb.js";
import penaltydb from "../model/penaltydb.js";
import performancedb from "../model/performancedb.js";
import playerdb from "../model/playerdb.js";
import playerlinkdb from "../model/playerlinkdb.js";
import rosterorderdb from "../model/rosterorderdb.js";
import roundorderdb from "../model/roundorderdb.js";
import teammeta from "../model/teammeta.js";

const tableModels = {
  cupdb,
  cuptypelookup,
  playerdb,
  playerlinkdb,
  matchdb,
  matchstattypedb,
  matchstatdb,
  eventdb,
  eventtypelookup,
  penaltydb,
  performancedb,
  rosterorderdb,
  roundorderdb,
  teammeta,
};

export default async function sqlGet(
  select,
  groupby,
  where,
  orderby,
  limit = "",
  returnType = "array"
) {
  let selects = [];
  let wheres = [];
  let groupbys = [];
  let orderbys = [];
  let sqlTables = new Set();
  let linkedTables = new Set();
  let joinedTables = "";

  for (let table in select) {
    if (table !== "none") sqlTables.add(table);
    for (let column of select[table]) {
      selects.push(table == "none" ? column : `${table}.${column}`);
    }
  }
  for (let table in where) {
    if (table !== "none") sqlTables.add(table);
    for (let column of where[table]) {
      wheres.push(table == "none" ? column : `${table}.${column}`);
    }
  }
  for (let table in groupby) {
    if (table !== "none") sqlTables.add(table);
    for (let column of groupby[table]) {
      groupbys.push(table == "none" ? column : `${table}.${column}`);
    }
  }
  for (let col of orderby) {
    for (let table in col) {
      if (table !== "none") sqlTables.add(table);
      let column = col[table];
      orderbys.push(column);
    }
  }
  if (sqlTables.size > 1) {
    let tableLinks = [];
    let linkedTables = new Set();
    for (let tableName in tableModels) {
      if (sqlTables.has(tableName)) tableLinks.push(tableName);
    }
    for (let table1 of tableLinks) {
      if (joinedTables == "") {
        joinedTables = table1;
      } else {
        let links = [];
        for (let colName in tableModels[table1].mapping) {
          let col1 = tableModels[table1].mapping[colName];
          if (!col1.link) continue;
          if (col1.primary) continue;
          for (let i = 0; i < Array.from(linkedTables).length; i++) {
            let table2 = Array.from(linkedTables)[i];
            let col2 = tableModels[table2].mapping[colName];
            if (!col2) continue;
            if (!col2.link) continue;
            if (!col1.primary && !col2.primary) continue;
            links.push(`${table1}.${colName} = ${table2}.${colName}`);
            break;
          }
        }
        joinedTables += ` INNER JOIN ${table1} ON ${links.join(" AND ")}`;
      }
      linkedTables.add(table1);
    }
  } else {
    joinedTables = Array.from(sqlTables)[0];
  }
  let query = `SELECT ${selects.join(",")}
            FROM ${joinedTables}
            WHERE 1=1 AND ${wheres.join(" AND ")}
            ${
              groupbys.length
                ? `GROUP BY ${groupbys
                    .map((x) => x.replace(/(\sas\s.+)/gim, ""))
                    .join(",")}`
                : ""
            }
            ${orderbys.length ? `ORDER BY ${orderbys.join(",")}` : ""}
            ${limit ? `LIMIT ${limit}` : ""}`;
  let sql = await db.query(query);
  return sql;
}
