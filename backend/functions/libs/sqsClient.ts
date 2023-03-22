import {
  MessageAttributeValue,
  SendMessageCommand,
  SendMessageCommandInput,
  SQSClient,
} from '@aws-sdk/client-sqs'
import { SQSMessageAttribute, SQSMessageAttributes } from 'aws-lambda'
import { DEFAULT_REGION } from '.'
import {
  nonEmpty,
  stringsToUint8Array,
  stringToUint8Array,
} from './commomUtils'

// Create SQS service object.
const sqsClient = new SQSClient({ region: DEFAULT_REGION })

interface SendMessageProps {
  messageBody: string
  queueUrl: string
  delaySeconds?: number
  messageAttributes?:
    | Record<string, MessageAttributeValue>
    | SQSMessageAttributes
}

type MessageId = string

const sendMessage = async (props: SendMessageProps): Promise<MessageId> => {
  console.log('sendMessage', props)
  const { messageBody, queueUrl, delaySeconds, messageAttributes } = props
  const input: SendMessageCommandInput = {
    MessageBody: messageBody,
    QueueUrl: queueUrl,
    DelaySeconds: delaySeconds ?? 5,
    MessageAttributes: transformMessageAttributes(messageAttributes),
  }
  try {
    const data = await sqsClient.send(new SendMessageCommand(input))
    if (!data.MessageId) {
      throw new Error('Some error occured !!')
    }
    console.log('Success, message sent. MessageID:', data.MessageId)
    const bodyMessage =
      'Message Send to SQS- Here is MessageId: ' + data.MessageId
    console.log(JSON.stringify(bodyMessage))
    return data.MessageId
  } catch (err) {
    console.error('Error', err)
    throw new Error(`Failed to send message to SQS !!`)
  }
}

const transformMessageAttributes = (
  messageAttributes?:
    | SQSMessageAttributes
    | Record<string, MessageAttributeValue>
): Record<string, MessageAttributeValue> | undefined => {
  if (!messageAttributes) return undefined

  const newMessageAttributes: Record<string, MessageAttributeValue> = {}
  Object.keys(messageAttributes).map(key => {
    const messageAttribute = messageAttributes[key]
    if ('StringValue' in messageAttribute)
      newMessageAttributes[key] = messageAttribute as MessageAttributeValue
    else {
      const {
        stringValue,
        binaryValue,
        stringListValues,
        binaryListValues,
        dataType,
      } = messageAttribute as SQSMessageAttribute

      const newMessageAttribute: MessageAttributeValue = {
        StringValue: stringValue,
        BinaryValue: binaryValue ? stringToUint8Array(binaryValue) : undefined,
        StringListValues: nonEmpty(stringListValues)
          ? stringListValues
          : undefined,
        BinaryListValues: nonEmpty(binaryListValues)
          ? stringsToUint8Array(binaryListValues as string[])
          : undefined,
        DataType: dataType as string,
      }
      newMessageAttributes[key] = newMessageAttribute
    }
  })
  return newMessageAttributes
}

export { sqsClient, sendMessage }
