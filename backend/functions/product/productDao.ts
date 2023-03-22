import BaseDAO, { QueryProps, QueryResult } from '../libs/baseDao'
import { Product } from './models'

type K = { userId: string; productId: string }
type D = Product

export default class ProcuctDAO extends BaseDAO<K, D> {
  constructor(tableName?: string) {
    super(tableName ?? (process.env.TABLE_NAME || ''))
  }

  query = async (
    props: QueryProps & { userId: string }
  ): Promise<QueryResult<D>> => {
    console.log('ProcuctDAO.query', props)
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
