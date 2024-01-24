import { boolean, pgTable, serial, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable("Users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    deleted: boolean("deleted").notNull().default(false)
  },
  (users) => ({
      emailIndex: uniqueIndex("email_index").on(users.email),
  })
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
