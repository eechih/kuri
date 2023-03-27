type Post = {
  userId: string
  groupId: string
  postId: string
  postUrl?: string
  postTime?: string // ISO 8601
  productId?: string
  productName?: string
  productPrice?: number
  productCost?: number
  productOption?: string[][]
  productDescription?: string
  productImageUrls?: string[]
  productLocation?: string
  productStatusDate?: string // ISO 8601
  tags?: string[]
  creationTime: string
}

export default Post
