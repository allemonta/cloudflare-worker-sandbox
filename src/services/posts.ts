import BaseSchemaService from "./base";
import * as postsSchemas from "$schemas/posts"
import * as usersSchemas from "$schemas/users"
import { ColumnBaseConfig, ColumnDataType, eq, inArray } from "drizzle-orm";
import { container, injectable, inject, delay } from "tsyringe";
import UsersService from "./users";
import DrizzleDB from "$components/DrizzleDB";
import { PgColumn, PgTable, TableConfig, } from "drizzle-orm/pg-core";

type PostWithUser = postsSchemas.Post & {
  user: usersSchemas.User
}

@injectable()
export default class PostsService extends BaseSchemaService<typeof postsSchemas.posts, PostWithUser> {
  pk = postsSchemas.posts.id
  mainTable = postsSchemas.posts
  postsDB = this.drizzle.query.posts

  constructor(
    @inject(DrizzleDB.token)
    drizzleDB: DrizzleDB,
    @inject(delay(() => UsersService))
    private usersService: UsersService
  ) {
    super(drizzleDB)
  }

  _injectUsers = async(posts: postsSchemas.Post[]): Promise<PostWithUser[]> => {
    if (posts.length === 0) {
      return []
    }

    const users = await this.usersService.mGetPartial<usersSchemas.User>(
      posts.map(post => post.userId)
    )

    return posts.map((post) => ({
      ...post,
      user: users.find(user => user?.id === post.userId)!
    }))
  }

  postProcess = async(users: postsSchemas.Post[]) => {
    return this._injectUsers(users)
  }

  delete = async(id: number): Promise<void> => {
    await this.drizzle.delete(postsSchemas.posts).where(eq(postsSchemas.posts.id, id))
  }

  static token = Symbol("PostsService")
}

container.register(PostsService.token, PostsService)
