import { Post } from "$schemas/posts";

const PostElement = ({ post }: { post: Post }) => (
  <p
    hx-delete={`/posts/${post.id}`}
    hx-swap="outerHTML"
    class="flex row items-center justify-between py-1 px-4 my-1 rounded-lg text-lg border bg-gray-100 text-gray-600 mb-2"
  >
    {post.data}
    <button class="font-medium">Delete</button>
  </p>
)


export default PostElement
