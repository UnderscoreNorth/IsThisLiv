import { mysqlTable } from "drizzle-orm/mysql-core/table";
import {
  boolean,
  date,
  datetime,
  double,
  int,
  tinyint,
  varchar,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

const teamCol = (name = "team") => varchar(name, { length: 25 });
const user = varchar("user", { length: 50 });

export const Cup = mysqlTable("cup", {
  cupID: int("cupID").primaryKey().autoincrement(),
  cupName: varchar("cupName", { length: 200 }),
  season: varchar("season", { length: 50 }).notNull(),
  year: int("year"),
  cupType: int("cupType").references(() => CupType.cupType),
  start: date("start"),
  end: date("end"),
  rankPoints: int("rankPoints"),
  user,
  pes: int("pes"),
});

export const CupType = mysqlTable("cuptype", {
  cupType: int("cupType").primaryKey(),
  description: varchar("desciprtion", { length: 200 }),
});
export const Round = mysqlTable("roundorder", {
  round: varchar("round", { length: 50 }).primaryKey(),
  order: int("order"),
});
export const EventType = mysqlTable("eventtype", {
  eventType: int("eventType").primaryKey(),
  description: varchar("description", { length: 50 }),
});
export const Match = mysqlTable("match", {
  matchID: int("matchID").primaryKey().autoincrement(),
  cupID: int("cupID").references(() => Cup.cupID),
  round: varchar("round", { length: 50 }).references(() => Round.round),
  homeTeam: teamCol("homeTeam"),
  awayTeam: teamCol("awayTeam"),
  winningTeam: teamCol("winningTeam"),
  endPeriod: int("endPeriod"),
  utcTime: datetime("utcTime"),
  attendance: int("attendance"),
  stadium: varchar("stadium", { length: 300 }),
  valid: tinyint("valid"),
  user,
  official: tinyint("official"),
});
export const Manager = mysqlTable("manager", {
  name: varchar("name", { length: 100 }),
  start: date("start"),
  end: date("end"),
  team: varchar("team", { length: 11 }),
});
export const PlayerLink = mysqlTable("playerlink", {
  linkID: int("linkID").primaryKey().autoincrement(),
  team: teamCol(),
  name: varchar("name", { length: 100 }),
});
export const RosterOrder = mysqlTable("rosterorder", {
  pos: varchar("pos", { length: 5 }).primaryKey(),
  order: int("order"),
  type: int("type"),
});
export const Player = mysqlTable("player", {
  playerID: int("playerID").primaryKey().autoincrement(),
  cupID: int("cupID").references(() => Cup.cupID),
  team: teamCol(),
  name: varchar("name", { length: 100 }),
  medal: varchar("medal", { length: 20 }),
  captain: boolean("captain"),
  regPos: varchar("regPos", { length: 5 }).references(() => RosterOrder.pos),
  shirtNumber: int("shirtNumber"),
  starting: boolean("starting"),
  linkID: int("linkID").references(() => PlayerLink.linkID),
  user,
});
//export const FantasyTeam = mysqlTable('fantasyTeam',)
export const Event = mysqlTable("event", {
  eventID: int("eventID").primaryKey().autoincrement(),
  matchID: int("matchID").references(() => Match.matchID),
  playerID: int("playerID").references(() => Player.playerID),
  eventType: int("eventType").references(() => EventType.eventType),
  regTime: int("regTime"),
  injTime: int("injTime"),
  user,
});
export const Performance = mysqlTable("performance", {
  perfID: int("perfID").primaryKey().autoincrement(),
  matchID: int("matchID").references(() => Match.matchID),
  playerID: int("playerID").references(() => Player.playerID),
  subOn: int("subOn"),
  subOff: int("subOff"),
  rating: double("rating"),
  saves: int("saves"),
  motm: boolean("motm"),
  user,
  cond: int("cond"),
  ff: int("ff"),
});
export const Penalty = mysqlTable("penalty", {
  penaltyID: int("penaltyID").primaryKey().autoincrement(),
  matchID: int("matchID").references(() => Match.matchID),
  playerID: int("playerID").references(() => Player.playerID),
  goal: boolean("goal"),
  user,
});
export const MatchStat = mysqlTable("matchstat", {
  statID: int("statID").primaryKey().autoincrement(),
  matchID: int("matchID").references(() => Match.matchID),
  home: boolean("home"),
  team: teamCol(),
  period: int("period"),
  finalPeriod: boolean("finalPeriod"),
  poss: int("poss"),
  shots: int("shots"),
  shotsOT: int("shotsOT"),
  fouls: int("fouls"),
  offsides: int("offsides"),
  freeKicks: int("freeKicks"),
  passComp: int("passComp"),
  passMade: int("passMade"),
  crosses: int("crosses"),
  interceptions: int("interceptions"),
  tackles: int("tackles"),
  saves: int("saves"),
  corners: int("corners"),
  passTot: int("passTot"),
});
export const Team = mysqlTable("team", {
  team: teamCol().primaryKey(),
  primaryHex: varchar("primaryHex", { length: 6 }),
});
export const User = mysqlTable("user", {
  name: varchar("name", { length: 50 }).primaryKey(),
  access: int("access"),
  hash: varchar("hash", { length: 100 }),
});
export const Stadiums = mysqlTable("stadium", {
  stadium: varchar("stadium", { length: 100 }).primaryKey(),
  alias: varchar("alias", { length: 100 }),
});
export const Fantasy = mysqlTable("fantasy", {
  teamID: int("teamID").autoincrement().primaryKey(),
  cupID: int("cupID").references(() => Cup.cupID),
  name: varchar("name", { length: 100000 }),
  prv: varchar("prv", { length: 8 }),
  pub: varchar("pub", { length: 3000 }),
});
export const FantasyPlayer = mysqlTable("fantasyp", {
  fID: int("fID").autoincrement().primaryKey(),
  teamID: int("teamID"),
  playerID: int("playerID"),
  start: tinyint("start"),
  cap: tinyint("cap"),
  r1: int("r1"),
  r2: int("r2"),
  r3: int("r3"),
  r4: int("r4"),
  ro16: int("ro16"),
  qf: int("qf"),
  sf: int("sf"),
  fn: int("fn"),
  tot: int("tot"),
  stage: int("stage"),
});

export const cupRelations = relations(Cup, ({ many }) => ({
  Match: many(Match),
}));

export const matchRelations = relations(Match, ({ many }) => ({
  Performance: many(Performance),
  Event: many(Event),
}));

export const eventRelations = relations(Event, ({ one, many }) => ({
  Match: one(Match, {
    fields: [Event.matchID],
    references: [Match.matchID],
  }),
}));
