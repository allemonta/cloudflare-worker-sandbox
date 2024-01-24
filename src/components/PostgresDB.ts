import { Env } from "$types/index"
import Postgres from "postgres"
import { injectable, container, inject } from "tsyringe"

@injectable()
export default class PostgresDB {
  sql: Postgres.Sql

  constructor(
    @inject("env")
    env: Env
  ) {
    this.sql = Postgres(env.HYPERDRIVE_SUPABASE.connectionString)
  }

  static token = Symbol("PostgresDB")
}

container.register(PostgresDB.token, PostgresDB)
