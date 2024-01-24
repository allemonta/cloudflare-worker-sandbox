import { pgTable, serial, integer, varchar } from 'drizzle-orm/pg-core';
import { users } from "$schemas/users"

export const posts = pgTable("Posts",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id),
    data: varchar("data", { length: 255 }).notNull(),
  }
)

export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
