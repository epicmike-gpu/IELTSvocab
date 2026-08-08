import { pgTable, serial, timestamp, varchar, integer, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 用户表
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    phone: varchar("phone", { length: 20 }).notNull().unique(),
    nickname: varchar("nickname", { length: 100 }),
    avatar: varchar("avatar", { length: 500 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("users_phone_idx").on(table.phone),
  ]
);

// 学习记录表
export const learningRecords = pgTable(
  "learning_records",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
    word_id: integer("word_id").notNull(),
    list_id: varchar("list_id", { length: 50 }).notNull(),
    status: varchar("status", { length: 20 }).notNull(), // 'known' or 'unknown'
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("learning_records_user_id_idx").on(table.user_id),
    index("learning_records_list_id_idx").on(table.list_id),
    index("learning_records_word_id_idx").on(table.word_id),
    index("learning_records_status_idx").on(table.status),
  ]
);

// 验证码表（用于手机号登录）
export const verificationCodes = pgTable(
  "verification_codes",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    phone: varchar("phone", { length: 20 }).notNull(),
    code: varchar("code", { length: 10 }).notNull(),
    expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
    used: varchar("used", { length: 10 }).default("false").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("verification_codes_phone_idx").on(table.phone),
  ]
);
