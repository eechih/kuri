interface Group {
  userId: string
  groupId: string
  name: string
  creationTime: string // ISO 8601
  lastModified?: string // ISO 8601
  messageId?: string // Message ID for SQS
  crawling?: boolean
  crawlStartTime?: string
  crawlEndTime?: string
  crawledTrace?: string
}

export { Group }
