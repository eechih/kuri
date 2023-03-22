interface Product {
  userId: string
  productId: string
  name?: string
  price?: number
  cost?: number
  option?: string[][]
  description?: string
  location?: string
  images?: string[]
  status?: number
  statusDate?: string // ISO 8601
  creationTime?: string // ISO 8601
  publishing?: boolean
  publishedProductId?: string // Product ID for Buy+1
  publishedPostId?: string // Post ID for Facebook
  publishLog?: string
}

export { Product }
