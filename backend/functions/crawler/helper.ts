import moment from 'moment'
import { find, propEq } from 'ramda'
import { getUniqueId } from '../libs/commomUtils'
import { sendMessage } from '../libs/sqsClient'
import CrawlerDAO from './crawlerDao'
import { Crawler, Group, groups } from './models'

const tableName = process.env.TABLE_NAME || ''
const crawlerQueueUrl = process.env.QUEUE_URL || ''
const crawlerDao = new CrawlerDAO(tableName)

const findGroupById = (groupId: string): Group | undefined => {
  return find<Group>(propEq('groupId', groupId))(groups)
}

type CreateCrawlerProps = {
  userId: string
  crawlerName: string
  parameters?: Record<string, string | number>
}

const createCrawler = async (props: CreateCrawlerProps): Promise<Crawler> => {
  console.log('createCrawler', props)
  const { userId, crawlerName, parameters = {} } = props
  try {
    const crawlerId = getUniqueId()
    const crawler: Crawler = {
      userId: userId,
      crawlerId: crawlerId,
      crawlerName: crawlerName,
      state: 'Pending',
      creationTime: moment().utcOffset(8).format(),
    }
    await crawlerDao.create(crawler)

    const messageBody = JSON.stringify({ ...parameters, userId, crawlerId })

    const messageId = await sendMessage({
      queueUrl: crawlerQueueUrl,
      messageBody: messageBody,
    })

    return await crawlerDao.patch({
      key: { userId, crawlerId },
      patches: [
        { op: 'add', path: '/messageId', value: messageId },
        { op: 'add', path: '/messageBody', value: messageBody },
      ],
    })
  } catch (err) {
    console.log('Error', err)
    throw 'Failed to create crawler !!'
  }
}

export { findGroupById, createCrawler }
