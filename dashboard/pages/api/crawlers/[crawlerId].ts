// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import * as R from 'ramda'

import Crawler from '@/src/models/crawler'
import crawlers from '@/src/samples/crawlers.json'

type Error = {
  message: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Crawler | Error>
) {
  const { crawlerId } = req.query
  const found = R.find(R.propEq('crawlerId', crawlerId), crawlers)
  if (!found) {
    res.status(404).json({ message: 'Invalid crawlerId' })
    return
  }
  res.status(200).json(found as Crawler)
}
