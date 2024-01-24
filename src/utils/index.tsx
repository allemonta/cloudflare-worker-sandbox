import { html } from 'hono/html'
import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return html`
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://unpkg.com/htmx.org@1.9.10" crossorigin="anonymous"></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <title> Hono</title>
      </head>
      <body>
        <div class="p-4">
          ${children}
        </div>
      </body>
    </html>
    `
})
