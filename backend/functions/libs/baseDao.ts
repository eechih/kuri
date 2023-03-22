import {
  DeleteCommand,
  DeleteCommandInput,
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
  QueryCommand,
  QueryCommandInput,
  UpdateCommand,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb'
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb'
import moment from 'moment'
import { isEmpty, mergeAll, prop } from 'ramda'
import { base64Decode, base64Encode, isNumeric, nonEmpty } from './commomUtils'
import { ddbDocClient } from './ddbClient'

/**
 * 參考 https://www.rfc-editor.org/rfc/rfc6902#appendix-A
 */
export type Patch = {
  op: string
  path: string
  value?: NativeAttributeValue
  from?: string
}

export type QueryProps = {
  limit?: number
  order?: 'ASC' | 'asc' | 'DESC' | 'desc'
  nextToken?: string
}

export type QueryResult<D> = {
  items?: D[]
  count?: number
  nextToken?: string
}

interface Expression {
  updateExpression: string
  expressionAttributeNames: Record<string, string>
  expressionAttributeValues: Record<string, NativeAttributeValue>
}

export default abstract class BaseDAO<
  K extends Record<string, string>,
  D extends Record<string, NativeAttributeValue>
> {
  tableName: string

  constructor(tableName: string) {
    this.tableName = tableName
  }

  public isExist = async (key: K): Promise<boolean> => {
    console.log('BaseDao.isExist', key)
    const item = await this.get(key)
    return !!item
  }

  public get = async (key: K): Promise<D | undefined> => {
    console.log('BaseDao.get', key)
    try {
      const input: GetCommandInput = {
        TableName: this.tableName,
        Key: key,
      }
      const data = await ddbDocClient.send(new GetCommand(input))
      console.log('Success - item:', data)
      return data.Item as D
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  public create = async (item: D): Promise<D> => {
    console.log('BaseDAO.create', item)
    try {
      const input: PutCommandInput = {
        TableName: this.tableName,
        Item: { ...item, creationTime: moment().utcOffset(8).format() },
      }
      const data = await ddbDocClient.send(new PutCommand(input))
      console.log('Success - item added:', data)
      return item
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  public update = async (item: D): Promise<D> => {
    console.log('BaseDAO.update', item)
    try {
      const input: PutCommandInput = {
        TableName: this.tableName,
        Item: { ...item, creationTime: moment().utcOffset(8).format() },
      }
      const data = await ddbDocClient.send(new PutCommand(input))
      console.log('Success - item updated:', data)
      return item
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  public patch = async (props: { key: K; patches: Patch[] }): Promise<D> => {
    console.log('BaseDAO.patch', props)
    try {
      const { key, patches } = props
      const expression = toExpression(patches)

      const input: UpdateCommandInput = {
        TableName: this.tableName,
        Key: key,
        ReturnValues: 'ALL_NEW',
      }
      if (nonEmpty(expression.updateExpression))
        input.UpdateExpression = expression.updateExpression
      if (nonEmpty(expression.expressionAttributeNames))
        input.ExpressionAttributeNames = expression.expressionAttributeNames
      if (nonEmpty(expression.expressionAttributeValues))
        input.ExpressionAttributeValues = expression.expressionAttributeValues

      const data = await ddbDocClient.send(new UpdateCommand(input))
      console.log('Success - item patched: ', data)
      return data.Attributes as D
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  public delete = async (key: K): Promise<D | undefined> => {
    console.log('BaseDAO.delete', key)
    try {
      const input: DeleteCommandInput = {
        TableName: this.tableName,
        Key: key,
      }
      const data = await ddbDocClient.send(new DeleteCommand(input))
      console.log('Success - item deleted')
      return data.Attributes as D
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  abstract query(props: QueryProps): Promise<QueryResult<D>>

  protected queryItems = async (
    props: QueryProps & {
      indexName?: string
      keyConditionExpression?: string
      filterExpression?: string
      expressionAttributeNames?: Record<string, string>
      expressionAttributeValues?: Record<string, NativeAttributeValue>
    }
  ): Promise<QueryResult<D>> => {
    console.log('BaseDAO.queryItems', props)
    try {
      const input: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: props.indexName,
        KeyConditionExpression: props.keyConditionExpression,
        FilterExpression: props.filterExpression,
        ExpressionAttributeNames: props.expressionAttributeNames,
        ExpressionAttributeValues: props.expressionAttributeValues,
        Limit: props.limit ?? 10,
        ScanIndexForward: !(props.order == 'desc' || props.order == 'DESC'),
        ExclusiveStartKey: formatNextToken(props.nextToken),
      }
      console.log('QueryCommandInput', input)
      const data = await ddbDocClient.send(new QueryCommand(input))
      console.log('Success - items: ', data)
      const result = {
        items: data.Items as D[],
        count: data.Count,
        nextToken: parseNextToken(data.LastEvaluatedKey),
      }
      return result
    } catch (err) {
      console.error(err)
      throw err
    }
  }
}

const formatNextToken = (
  nextToken?: string
): Record<string, NativeAttributeValue> | undefined => {
  try {
    if (nextToken) return JSON.parse(base64Decode(nextToken))
  } catch (err) {
    console.error(err)
  }
  return undefined
}

const parseNextToken = (
  lastEvaluatedKey?: Record<string, NativeAttributeValue>
): string | undefined => {
  try {
    if (lastEvaluatedKey) return base64Encode(JSON.stringify(lastEvaluatedKey))
  } catch (err) {
    console.error(err)
  }
  return undefined
}

/**
 * Convert rfc6902 patches to DynamoDB update expresstions
 * @param patches rfc6902 patch array
 * @returns
 */
export const toExpression = (patches: Patch[]): Expression => {
  const expressions = [toRemoveExpression(patches), toSetExpression(patches)]
  const updateExpression = expressions
    .map(expression => expression.updateExpression)
    .filter(updateExpression => !isEmpty(updateExpression))
    .join(' ')
    .trim()
  const expressionAttributeNames = mergeAll(
    expressions.map(prop('expressionAttributeNames'))
  )
  const expressionAttributeValues = mergeAll(
    expressions.map(prop('expressionAttributeValues'))
  )
  return {
    updateExpression,
    expressionAttributeNames,
    expressionAttributeValues,
  }
}

/**
 * Convert rfc6902 patches to DynamoDB update expresstions for REMOVE action
 * @param patches rfc6902 patch array
 * @returns
 */
const toRemoveExpression = (patches: Patch[]): Expression => {
  const attributeNames: Record<string, string> = {}
  const attributeValues: Record<string, NativeAttributeValue> = {}

  const actions = patches
    .filter(({ op }) => op.toLocaleLowerCase() == 'remove')
    .map(({ path }) => {
      return path
        .split('/')
        .filter(partPath => !isEmpty(partPath))
        .reduce((previousValue, partPath) => {
          if (isNumeric(partPath)) {
            return previousValue + '[' + partPath + ']'
          } else {
            const attributeName = '#' + partPath
            attributeNames[attributeName] = partPath
            if (previousValue == '') return attributeName
            else return previousValue + '.' + attributeName
          }
        }, '')
    })

  let updateExpression = ''
  if (!isEmpty(actions)) updateExpression = 'REMOVE ' + actions.join(', ')

  return {
    updateExpression,
    expressionAttributeNames: attributeNames,
    expressionAttributeValues: attributeValues,
  }
}

/**
 * Convert rfc6902 patches to DynamoDB update expresstions for SET action
 * @param patches rfc6902 patch array
 * @returns
 */
const toSetExpression = (patches: Patch[]): Expression => {
  const attributeNames: Record<string, string> = {}
  const attributeValues: Record<string, NativeAttributeValue> = {}

  const actions = patches
    .filter(({ op }) => {
      const _op = op.toLocaleLowerCase()
      return _op == 'add' || _op == 'replace'
    })
    .map(({ path, value }) => {
      const _path = path
        .split('/')
        .filter(partPath => !isEmpty(partPath))
        .reduce((previousValue, partPath) => {
          if (isNumeric(partPath)) {
            return previousValue + '[' + partPath + ']'
          } else {
            const attributeName = '#' + partPath
            attributeNames[attributeName] = partPath
            if (previousValue == '') return attributeName
            else return previousValue + '.' + attributeName
          }
        }, '')

      // First remove the leading slashe, then replace the remaining slashes with underscores.
      const attributeValue = ':' + path.substring(1).replace(/\//g, '_')
      attributeValues[attributeValue] = value
      return _path + ' = ' + attributeValue
    })

  let updateExpression = ''
  if (!isEmpty(actions)) updateExpression = 'SET ' + actions.join(', ')

  return {
    updateExpression,
    expressionAttributeNames: attributeNames,
    expressionAttributeValues: attributeValues,
  }
}
