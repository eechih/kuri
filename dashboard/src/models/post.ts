type Post = {
  userId: string
  postId: string
  postURL: string
  postMessage?: string
  postImages: string[]
  postCreationTime: string // ISO 8601
  postCrawledTime: string // ISO 8601
  groupId: string
  groupName: string
  productId?: string
  productName?: string
  productPrice?: number
  productCost?: number
  productOption?: string[][]
  productDescription?: string
  productImages?: string[]
  productStatusDate?: string // ISO 8601
  productStatus?: number
  productPublishUrl?: string
  tags?: string[]
  creationTime: string
}

export default Post
