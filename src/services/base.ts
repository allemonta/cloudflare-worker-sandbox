/* eslint-disable @typescript-eslint/no-explicit-any */
import DrizzleDB, { DrizzleWithSchemas } from "$components/DrizzleDB";
import Postgres from "postgres"
import { PgColumn, PgTable, PgSelect, PgTransaction } from "drizzle-orm/pg-core";
import { eq, inArray } from "drizzle-orm";
import { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";

export type CommonTransaction = PgTransaction<PostgresJsQueryResultHKT, any, any>

export type CommonOptions = {
  baseQuery?: BaseQuery,
  transaction?: CommonTransaction
}

export type BaseQuery = (options?: CommonOptions) => PgSelect

export default abstract class BaseSchemaService<P extends PgTable, E> {
  drizzle: DrizzleWithSchemas
  sql: Postgres.Sql

  abstract mainTable: P
  abstract pk: PgColumn

  constructor(
    drizzleDB: DrizzleDB
  ) {
    this.sql = drizzleDB.sql
    this.drizzle = drizzleDB.drizzle
  }

  abstract postProcess?: (results: P["$inferSelect"][]) => Promise<E[]>

  getPkValue = (entity: any): any => {
    return (entity as any)[this.pk.name]
  }

  baseQuery: BaseQuery = (options?: CommonOptions) => {
    const {
      baseQuery,
      transaction
    } = options || {}

    if (baseQuery) {
      return baseQuery({ transaction })
    }

    const db = transaction || this.drizzle
    return db
      .select()
      .from(this.mainTable)
      .$dynamic()
  }

  _postProcess = async (rawResults: P["$inferSelect"][]): Promise<E[]> => {
    let results: E[] = []

    if (this.postProcess) {
      if (rawResults.length) {
        results = await this.postProcess(rawResults)
      }
    } else {
      results = rawResults as unknown as E[]
    }

    return results
  }

  get = async (pk: number, options?: CommonOptions): Promise<E | null> => {
    const rawResults = await this.baseQuery(options).where(eq(this.pk, pk))
    const results = await this._postProcess(rawResults)

    const [result] = results

    if (!result) {
      return null
    }

    return result
  }

  getOrFail = async (pk: number, options?: CommonOptions): Promise<E> => {
    const result = await this.get(pk, options)

    if (!result) {
      throw new Error(`No ${this.mainTable} found with ${this.pk} ${pk}`)
    }

    return result
  }

  mGet = async (pks: number[], options?: CommonOptions): Promise<E[]> => {
    if (pks.length === 0) {
      return []
    }

    const rawResults = await this.baseQuery(options).where(inArray(this.pk, pks))
    const fullfilledResults = await this._postProcess(rawResults)
    return pks.map(pk => fullfilledResults.find(result => this.getPkValue(result) === pk)!)
  }

  list = async (options?: CommonOptions): Promise<E[]> => {
    const rawResults = await this.baseQuery(options)
    const results = await this._postProcess(rawResults)

    return results
  }

  count = async (options?: CommonOptions): Promise<number> => {
    const count = (await this.baseQuery(options)).length
    return count
  }

  mGetPartial = async <P = Partial<E>>(pks: number[], options?: CommonOptions): Promise<P[]> => {
    if (pks.length === 0) {
      return []
    }

    const rawResults = await this.baseQuery(options).where(inArray(this.pk, pks))
    return pks.map(pk => rawResults.find(result => result[this.pk.name] === pk) as P)
  }

  insert = async (data: P["$inferInsert"], options?: CommonOptions): Promise<E> => {
    const {
      transaction
    } = options || {}

    const db = transaction || this.drizzle

    const [result] = await db
      .insert(this.mainTable)
      .values(data)
      .returning({ [this.pk.name]: this.pk })

    const pkValue = this.getPkValue(result)
    return this.getOrFail(pkValue, options)
  }

  update = async (pk: number, data: Partial<P["$inferInsert"]>, options?: CommonOptions): Promise<E> => {
    const {
      transaction
    } = options || {}

    const db = transaction || this.drizzle

    await db
      .update(this.mainTable)
      .set(data)
      .where(eq(this.pk, pk))

    return this.getOrFail(pk, options)
  }
}

