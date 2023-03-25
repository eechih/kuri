// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import moment from 'moment'
import type { NextApiRequest, NextApiResponse } from 'next'

import Crawler from '@/src/models/crawler'
import crawlers from '@/src/samples/crawlers.json'

type Error = {
  message: string
}

type Data = {
  items: Crawler[]
  count: number
  nextToken?: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Crawler | Error>
) {
  if (req.method == 'GET') {
    res.status(200).json({
      items: crawlers,
      count: crawlers.length,
      nextToken: 'eyJ1c2VySWQiOiJ0ZXN0IiwiY3JlYXRpb25UaW1lIjo=',
    })
  } else if (req.method == 'POST') {
    const { crawlerName = 'Facebook' } = req.query as { crawlerName: string }
    const newCralwer = {
      messageId: '0c7b86b1-4b4d-4548-8348-1121212121',
      messageBody: req.body,
      userId: 'test',
      creationTime: moment().utcOffset(8).format(),
      crawlerName: crawlerName,
      crawlerId: 'eda350bea1f8264ebd' + moment().valueOf(),
      state: 'Pending',
    }
    res.status(200).json(newCralwer)
  } else {
    res.status(405).json({ message: 'Method Not Allowed' })
  }
}
