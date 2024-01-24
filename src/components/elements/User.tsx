import { UserWithPosts } from "$services/users"

const PostElement = ({ user }: { user: UserWithPosts }) => (
  <div
    id={`user-${user.id}`}
    class="flex row items-center justify-between py-1 px-4 my-1 rounded-lg text-lg border bg-gray-100 text-gray-600 mb-2"
  >
    <p> {user.email} ({user.posts.length}) </p>
    <div>
      <a class="pr-4" href={`/users/${user.id}/posts`}> POSTS </a>
      <button
        hx-delete={`/users/${user.id}`}
        hx-swap="this"
        class="font-medium"
      > DELETE </button>
    </div>
  </div>
)


export default PostElement
