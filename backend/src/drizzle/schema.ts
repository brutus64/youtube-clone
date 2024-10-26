import {boolean, serial, text, integer, json, timestamp, pgTable } from "drizzle-orm/pg-core"

export const user = pgTable("user", {
    id: serial("id").primaryKey(),
    username: text("username"),
    email: text("email"),
    password: text("password"),
    disabled: boolean("disabled").default(true),
    verification_key: text("verification_key")
});

export const session = pgTable("session", {
    sid: text("sid").primaryKey(),
    sess: json("sess"),
    expire: timestamp("expire")
});