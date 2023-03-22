type Crawler = {
  userId: string
  crawlerId: string
  crawlerName?: string
  state: string
  messageId?: string
  messageBody?: string
  creationTime?: string // ISO 8601
  processingTime?: string // ISO 8601
  completedTime?: string // ISO 8601
  failedTime?: string // ISO 8601
  tracing?: string
}

export default Crawler
