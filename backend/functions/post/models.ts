interface CrawledPost {
  userId: string
  postId: string
  message?: string
  wwwURL?: string
  photoImages?: string[]
  groupId: string
  groupName?: string
  creationTime?: string // ISO 8601
  crawledTime?: string // ISO 8601
}

interface Post {
  userId: string
  groupId: string
  postId: string
  postUrl?: string
  productName?: string
  productPrice?: number
  productCost?: number
  productOption?: string[][]
  productDescription?: string
  productImageUrls?: string[]
  productStatusDate?: string // ISO 8601
  tags?: string[]
}

export { CrawledPost, Post }
