import "reflect-metadata"
import App from './app';
import { Env } from '$types/index';
import { container } from "tsyringe";

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      container.register("env", { useValue: env })
      const app = await App(env)
      return app.fetch(request, env, ctx)
    } catch (err) {
      const error = err as Error
      return new Response(error.message, {
        status: 500
      })
    }
	}
};
