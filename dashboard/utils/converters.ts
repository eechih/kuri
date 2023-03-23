import Post from 'models/post'
import Product from 'models/product'
import moment from 'moment'

export const convertToProduct = (props: { post: Post }): Product => {
  const { post } = props
  const {
    productId,
    productName = '',
    productPrice = 0,
    productCost = 0,
    productDescription = '',
    productOption = [],
    productImages = [],
    productStatusDate,
    productStatus = 0,
    groupName = '',
  } = post

  const name = productId
    ? `S1-${productId} ${productName}`
    : `{{product-id}} ${productName}`
  const statusDate = moment(productStatusDate).utcOffset(8)

  const descritions: string[] = []
  descritions.push(name)
  descritions.push(`🍓特價：${productPrice}`)
  descritions.push('')
  if (productOption.length > 0) {
    const option = productOption.map(option => option.join('，')).join(' / ')
    descritions.push(`✔️商品規格：[${option}]`)
    const example = productOption.map(option => option[0]).join('')
    descritions.push(`✔️下單範例：${example}+1`)
  }
  descritions.push(`✔️收單日期：${statusDate.format('M/D')} 晚上8點準時收單`)
  descritions.push('')
  const description = descritions.join('\n') + '\n' + productDescription

  const product: Product = {
    userId: 'test',
    productId: productId ?? '0',
    name: name,
    price: productPrice,
    cost: productCost,
    option: productOption,
    description: description,
    location: groupName,
    images: productImages,
    statusDate: statusDate.format('YYYY-MM-DD HH:mm'),
    status: productStatus,
    creationTime: '',
  }
  return product
}
