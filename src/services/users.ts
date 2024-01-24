import BaseSchemaService, { CommonOptions } from "./base";
import * as usersSchemas from "$schemas/users"
import * as postsSchemas from "$schemas/posts"
import { eq, inArray } from "drizzle-orm";
import { container, delay, inject, injectable } from "tsyringe";
import PostsService from "$services/posts";
import DrizzleDB from "$components/DrizzleDB";

type withPosts<T> = T & {
  posts: postsSchemas.Post[]
}

export type BaseUser = Omit<usersSchemas.User, "password">
export type UserWithPosts = withPosts<BaseUser>

@injectable()
export default class UsersService extends BaseSchemaService<typeof usersSchemas.users, UserWithPosts> {
  mainTable = usersSchemas.users
  pk = usersSchemas.users.id

  constructor(
    @inject(DrizzleDB.token)
    drizzleDB: DrizzleDB,
    @inject(delay(() => PostsService))
    private postsService: PostsService
  ) {
    super(drizzleDB)
  }

  baseQuery = (options?: CommonOptions) => {
    const { transaction } = options || {}
    const db = transaction || this.drizzle

    return db
      .select({
        id: this.mainTable.id,
        email: this.mainTable.email,
        deleted: this.mainTable.deleted
      })
      .from(this.mainTable)
      .where(eq(this.mainTable.deleted, false))
      .$dynamic()
  }

  _injectPosts = async <T extends { id: number }>(users: T[]): Promise<(withPosts<T>[])> => {
    if (users.length === 0) {
      return []
    }

    const postIds = await this.postsService.postsDB.findMany({
      columns: {
        id: true
      },
      where: inArray(postsSchemas.posts.userId, users.map(user => user.id))
    })

    const posts = await this.postsService.mGetPartial<postsSchemas.Post>(
      postIds.map(post => post.id)
    )

    return users.map((user) => ({
      ...user,
      posts: posts.filter(post => post?.userId === user.id)
    }))
  }

  postProcess = async(users: usersSchemas.User[]) => {
    return this._injectPosts(users)
  }

  delete = async(id: number): Promise<void> => {
    await this.drizzle.update(this.mainTable)
      .set({
        deleted: true
      })
      .where(eq(this.mainTable.id, id))
  }

  static token = Symbol("UsersService")
}

container.register(UsersService.token, UsersService)
