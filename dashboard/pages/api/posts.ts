// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

import Post from '@/src/models/post'
import posts from '@/src/samples/posts.json'

type Data = {
  items: Post[]
  count: number
  nextToken?: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  res.status(200).json({
    items: posts,
    count: posts.length,
    nextToken: 'eyJ1c2VySWQiOiJ0ZXN0IiwiY3JlYXRpb25UaW1lIjo=',
  })
}
