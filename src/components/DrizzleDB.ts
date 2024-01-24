import { drizzle } from "drizzle-orm/postgres-js"
import Postgres from "postgres"

import * as postsSchemas from "$schemas/posts"
import * as usersSchemas from "$schemas/users"
import { container, inject, injectable } from "tsyringe"
import PostgresDB from "$components/PostgresDB"

const getDrizzle = (sql: Postgres.Sql) => {
  return drizzle(sql, {
    schema: {
      ...postsSchemas,
      ...usersSchemas
    }
  })
}
export type DrizzleWithSchemas = ReturnType<typeof getDrizzle>

@injectable()
export default class DrizzleDB {
  drizzle: DrizzleWithSchemas
  sql: Postgres.Sql

  constructor(
    @inject(PostgresDB.token)
    PostgresDB: PostgresDB
  ) {
    this.sql = PostgresDB.sql
    this.drizzle = getDrizzle(this.sql)
  }

  static token = Symbol("DrizzleDB")
}

container.register(DrizzleDB.token, DrizzleDB)
