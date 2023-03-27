// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import * as R from 'ramda'

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
  const { limit, order } = req.query
  const postTime = R.prop('postTime')

  const sortedPosts =
    order == 'desc'
      ? R.sortWith([R.descend(R.prop('postTime'))], posts)
      : R.sortWith([R.ascend(R.prop('postTime'))], posts)

  res.status(200).json({
    items: sortedPosts,
    count: posts.length,
    nextToken: 'eyJ1c2VySWQiOiJ0ZXN0IiwiY3JlYXRpb25UaW1lIjo=',
  })
}
