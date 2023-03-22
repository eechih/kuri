import BaseDAO, { QueryProps, QueryResult } from '../libs/baseDao'
import { Group } from './models'

type K = { userId: string; groupId: string }
type D = Group

const defaultTableName = process.env.TABLE_NAME || ''

export default class GroupDAO extends BaseDAO<K, D> {
  constructor(tableName?: string) {
    super(tableName ?? defaultTableName)
  }

  query = async (
    props: QueryProps & { userId: string }
  ): Promise<QueryResult<D>> => {
    console.log('GroupDAO.query', props)
    const { userId, limit, nextToken, order } = props
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
}
