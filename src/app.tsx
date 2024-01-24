import { Hono } from "hono"
import type { Env } from "./types"
import PostgresDB from "$components/PostgresDB"
import DrizzleDB from "$components/DrizzleDB"
import { container } from "tsyringe"
import UsersService from "$services/users"
import PostsService from "$services/posts"

import { renderer } from '$utils/index'

import PostElement from "$components/elements/Post"
import UserElement from "$components/elements/User"

const workerId = Math.random().toString(36).substring(7)
let first = true

export default async (env: Env): Promise<Hono> => {
	const app = new Hono()

	const postgres = container.resolve<PostgresDB>(PostgresDB.token)
	const drizzle = container.resolve<DrizzleDB>(DrizzleDB.token)

  const usersService = container.resolve<UsersService>(UsersService.token)
  const postsService = container.resolve<PostsService>(PostsService.token)

	app.get("*", renderer)

  app.use(async (ctx, next) => {
    ctx.header("X-Worker-Id", workerId)
    ctx.header("X-New-Worker", first.toString())

    first = false
    await next()
  })

  app.get('/', async (ctx) => {
    const users = await usersService.list()

    return ctx.render(
      <>
        <h1> Users </h1>
        <div
          id="users-div"
        >
          <ul>
            {users.map((user) => (
              <li> <UserElement user={user} /> </li>
            ))}
          </ul>
        </div>

        <button
          hx-post={`/users`}
          hx-target="#users-div"
          hx-swap="beforeend"
          class="flex row items-center justify-between py-1 px-4 my-1 rounded-lg text-lg border bg-gray-100 text-gray-600 mb-2"
        >
          CREATE
        </button>
      </>
    )
  })

  app.get('/users/:id/posts', async (ctx) => {
    const start = Date.now()
    const user = await usersService.getOrFail(+ctx.req.param('id'))
    const end = Date.now()

    ctx.header("X-User-Load-Time", (end - start).toString() + "ms")

    return ctx.render(
      <>
        <h1 class="mb-5"> {user.email} ({user.posts.length}) </h1>
        <div id="posts-div">
            {user.posts.map((post) => (
              <PostElement post={post} />
            ))}
        </div>

        <button
          hx-post={`/users/${user.id}/posts`}
          hx-target="#posts-div"
          hx-swap="beforeend"
          class="flex row items-center justify-between py-1 px-4 my-1 rounded-lg text-lg border bg-gray-100 text-gray-600 mb-2 mt-5"
        >
          CREATE
        </button>
      </>
    )
  })

  app.post('/users', async (ctx) => {
    const newUser = {
      email: `allemonta+${Date.now()}@gmail.com`,
      password: '123456'
    }

    const start = Date.now()
    const user = await usersService.insert(newUser)
    const end = Date.now()
    ctx.header("X-User-Load-Time", (end - start).toString() + "ms")

    return ctx.html((
      <UserElement user={user} />
    ))
  })

  app.delete('/users/:id', async (ctx) => {
    const start = Date.now()
    const user = await usersService.getOrFail(+ctx.req.param('id'))
    await usersService.delete(user.id)
    const end = Date.now()
    ctx.header("X-User-Load-Time", (end - start).toString() + "ms")

    return ctx.body(null)
  })

  app.delete('/posts/:id', async (ctx) => {
    const start = Date.now()
    const post = await postsService.getOrFail(+ctx.req.param('id'))
    await postsService.delete(post.id)
    const end = Date.now()

    return ctx.body(null)
  })

  app.post("/users/:id/posts", async (ctx) => {
    const user = await usersService.getOrFail(+ctx.req.param('id'))

    const newPost = {
      data: `Post ${Date.now()}`,
      userId: user.id
    }

    const post = await postsService.insert(newPost)
    return ctx.html((
      <PostElement post={post} />
    ))
  })


  // API

  app.get("/api/health", async (ctx) => {
    return ctx.json({
      workerId,
      status: "ok"
    })
  })

  app.get("/api/users", async (ctx) => {
    const users = await usersService.list()
    return ctx.json(users)
  })

  app.get("/api/users/:id", async (ctx) => {
    const id = +ctx.req.param('id')
    const user = await usersService.get(id)

    if (!user) {
      return ctx.notFound()
    }

    return ctx.json(user)
  })

  app.get("/api/posts", async (ctx) => {
    const posts = await postsService.list()
    return ctx.json(posts)
  })

  app.get("/api/posts/:id", async (ctx) => {
    const id = +ctx.req.param('id')
    const post = await postsService.get(id)

    if (!post) {
      return ctx.notFound()
    }

    return ctx.json(post)
  })

	return app
}
