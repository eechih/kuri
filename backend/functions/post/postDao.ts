import { NativeAttributeValue } from '@aws-sdk/util-dynamodb'
import BaseDAO, { QueryProps, QueryResult } from '../libs/baseDao'
import { Post } from './models'

type K = { userId: string; postId: string }
type D = Post

export default class PostDAO extends BaseDAO<K, D> {
  constructor(tableName: string) {
    super(tableName)
  }

  query = async (
    props: QueryProps & { userId: string; groupId?: string }
  ): Promise<QueryResult<D>> => {
    console.log('PostDAO.query', props)
    const { userId, groupId, limit, nextToken, order } = props

    try {
      const indexName: string | undefined = groupId ? 'groupIdIndex' : undefined

      const keyConditionExpression = groupId
        ? 'groupId = :groupId'
        : 'userId = :userId'

      const expressionAttributeValues: Record<string, NativeAttributeValue> = {}
      if (groupId) expressionAttributeValues[':groupId'] = groupId
      else expressionAttributeValues[':userId'] = userId

      const filterExpression = undefined

      return await this.queryItems({
        indexName,
        keyConditionExpression,
        filterExpression,
        expressionAttributeValues,
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
