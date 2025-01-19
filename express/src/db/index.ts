import mysql from "mysql2/promise";
import config from "../../config.json";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema";

export const db = drizzle(mysql.createPool(config.sql), {
  schema,
  mode: "default",
});
