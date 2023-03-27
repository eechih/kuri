import moment from 'moment'
import { CrawledPost, Post } from './models'

type Article = string[]
export type AnalyzeResult<T> = { data: T; index: number } | null

const analyse = (crawledPost: CrawledPost): Post => {
  const post: Post = {
    userId: crawledPost.userId,
    groupId: crawledPost.groupId,
    postId: crawledPost.postId,
    postTime: crawledPost.postTime,
    productLocation: crawledPost.groupName,
  }
  const { message } = crawledPost
  if (!message || message.trim() == '') return post

  const article: Article = message.split('\n')?.map(s => s.trim())
  const productName = findProductName(article)
  const cost = findCost(article)
  const price = findPrice(article)
  const dueDate = findDueDate(article)
  const option = findOption(article)
  const tags = findTags(article)

  const productDesc = findProductDesc(article, {
    priceIndex: price?.index,
    optionIndex: option?.index,
  })

  post.productName = productName?.data?.trim()
  post.productPrice = price?.data
  post.productCost = cost?.data
  post.productStatusDate = dueDate?.data.format()
  post.productOption = option?.data
  post.productDescription = productDesc
  post.tags = tags?.data
  return post
}

interface FindProductDescProps {
  priceIndex?: number
  optionIndex?: number
}

function findDueDate(article: Article): AnalyzeResult<moment.Moment> {
  const DUE_DATE_REGEX = /\S*([0-9]{1,2})\/([0-9]{1,2}).*收單\S*/
  const dueDateIndex = article.findIndex(s => DUE_DATE_REGEX.test(s))
  if (dueDateIndex == -1) return null
  const dueDateString = article[dueDateIndex]
  const mo = dueDateString.match(DUE_DATE_REGEX)
  if (!mo) return null

  const defaultDueDate = moment()
    .utcOffset(8)
    .add(7, 'days')
    .hour(20)
    .minute(0)
    .second(0)

  const month = parseInt(mo[1])
  const dateOfMonth = parseInt(mo[2])

  const dueDate = defaultDueDate
    .clone()
    .month(month - 1)
    .date(dateOfMonth)

  const result = {
    data: moment.min(dueDate, defaultDueDate),
    index: dueDateIndex,
  }
  return result
}

function findTags(article: Article): AnalyzeResult<string[]> {
  const partialText = article.slice(0, 10).join()
  const keywords = ['現貨', '限量', '重新開團', '售完關團']
  const tags = keywords.filter(keyword => partialText.indexOf(keyword) > -1)
  return {
    data: tags,
    index: -1,
  }
}

function findProductName(article: Article): AnalyzeResult<string> {
  const PRODUCT_NAME_REGEX = /^(\w+-\d+)(\s?)(.*)/
  const index = article.findIndex(s => PRODUCT_NAME_REGEX.test(s))
  if (index == -1) return null

  const mo = article[index].match(PRODUCT_NAME_REGEX)
  if (mo) {
    return {
      data: mo[3],
      index: index,
    }
  }
  return null
}

function findCost(article: Article): AnalyzeResult<number> {
  const COST_REGEX = /^批/
  const index = article.findIndex(s => COST_REGEX.test(s))
  if (index == -1) return null

  const cost_string = article[index]
  const cost = cost_string.match(/(\d+)/)

  const result = {
    data: cost ? parseInt(cost[0]) : -1,
    index: index,
  }
  return result
}

function findPrice(article: Article): AnalyzeResult<number> {
  const PRICE_REGEX = /[售價]\W*\d+/
  const index = article.findIndex(
    s => PRICE_REGEX.test(s) && !s.startsWith('批')
  )
  if (index == -1) return null

  const price_string = article[index]
  const price = price_string.match(/(\d+)/)
  const result = {
    data: price ? parseInt(price[0]) : -1,
    index: index,
  }
  return result
}

function findOption(article: Article): AnalyzeResult<string[][]> {
  const SPEC_REGEX = /(?=.*[[［])(?=.*[\]］]).*/
  const index = article.findIndex(s => SPEC_REGEX.test(s))
  if (index == -1) return null

  const spec_string = article[index]

  const mo = spec_string.match(/[[［](.*)[\]］]/)
  if (!mo) return null

  const optionsStrings = mo[1].split(/\//)
  const option = optionsStrings.map(optionsString => {
    return optionsString.split(/[,，]/).map(s => s.trim())
  })
  const result = {
    data: option,
    index: index,
  }
  return result
}

export function findProductDesc(
  article: Article,
  props: FindProductDescProps
): string {
  console.log('findProductDesc', props)

  if (!article || article.length == 0) return ''
  let startIndex = 0
  if (props.priceIndex) startIndex = props.priceIndex + 1
  if (props.optionIndex) startIndex = props.optionIndex + 1
  while (article[startIndex]?.trim() === '') startIndex++ // 跳過空白行(重複)
  if (article[startIndex].includes('範例')) startIndex++ // 含有關鍵字，跳到下一行
  if (article[startIndex].includes('隨機')) startIndex++ // 含有關鍵字，跳到下一行
  return article
    .slice(startIndex)
    .join('\n')
    .replace(/^\n*/, '') // 將開頭的換行符號刪除
    .replace(/\n*$/, '') // 將最後的換行符號刪除
    .trim()
}

export { analyse, findOption, findProductName, findTags }
