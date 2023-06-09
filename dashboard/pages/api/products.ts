// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

import Product from '@/src/models/product'
import products from '@/src/samples/products.json'

type Data = {
  items: Product[]
  count: number
  nextToken?: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  res.status(200).json({
    items: products,
    count: products.length,
    nextToken: 'eyJ1c2VySWQiOiJ0ZXN0IiwiY3JlYXRpb25UaW1lIjo=',
  })
}
