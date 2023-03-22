import moment from 'moment'
import BaseDAO, { Patch, QueryProps, QueryResult } from '../libs/baseDao'
import { Crawler } from './models'

type K = { userId: string; crawlerId: string }
type D = Crawler

export default class CrawlerDAO extends BaseDAO<K, D> {
  constructor(tableName: string) {
    super(tableName)
  }

  query = async (
    props: QueryProps & { userId: string }
  ): Promise<QueryResult<D>> => {
    console.log('CrawlerDAO.query', props)
    const { userId, limit, order, nextToken } = props

    try {
      return await this.queryItems({
        indexName: 'creationTimeIndex',
        keyConditionExpression: 'userId = :userId',
        expressionAttributeValues: { ':userId': userId },
        limit,
        order,
        nextToken,
      })
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  updateState = async (props: {
    key: K
    state: 'Processing' | 'Completed' | 'Failed'
    tracing?: string
  }): Promise<D> => {
    console.log('CrawlerDAO.updateState', props)
    const { key, state, tracing } = props

    try {
      const now = moment().utcOffset(8)

      const patches: Patch[] = [{ op: 'replace', path: '/state', value: state }]

      if (state === 'Processing') {
        patches.push({
          op: 'add',
          path: '/processingTime',
          value: now.format(),
        })
        patches.push({ op: 'remove', path: '/completedTime' })
        patches.push({ op: 'remove', path: '/failedTime' })
      } else if (state === 'Completed') {
        patches.push({ op: 'add', path: '/completedTime', value: now.format() })
      } else if (state === 'Failed') {
        patches.push({ op: 'add', path: '/failedTime', value: now.format() })
      }

      if (tracing) {
        patches.push({ op: 'replace', path: '/tracing', value: tracing })
      } else {
        patches.push({ op: 'remove', path: '/tracing' })
      }

      return await this.patch({ key, patches })
    } catch (err) {
      console.error(err)
      throw err
    }
  }
}
