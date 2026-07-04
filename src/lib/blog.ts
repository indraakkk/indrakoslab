import { createServerFn } from '@tanstack/react-start'

import { getAllPosts, getPost } from '@/lib/content'

/**
 * Server functions wrapping the content pipeline. Route loaders call these
 * so the markdown + `marked` stay out of the client bundle: prerendered
 * pages ship the dehydrated result, and client-side navigations fetch it
 * from the Worker.
 */

export const fetchPosts = createServerFn({ method: 'GET' }).handler(() =>
  getAllPosts(),
)

export const fetchPost = createServerFn({ method: 'GET' })
  .validator((slug: string) => slug)
  // A malformed slug is a not-found, not a server error — return null so
  // the route loader can throw notFound() and the branded 404 renders.
  .handler(({ data }) =>
    typeof data === 'string' && /^[a-z0-9-]+$/.test(data)
      ? (getPost(data) ?? null)
      : null,
  )
