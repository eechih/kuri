import * as cheerio from 'cheerio'
import FormData from 'form-data'
import moment from 'moment'
import qs from 'querystring'
import { httpClient } from '../../libs/httpClient'

export interface Product {
  productId?: string
  name?: string
  price?: number
  cost?: number
  option?: string[][]
  description?: string
  location?: string
  images?: string[]
  status?: number
  statusDate?: string // ISO 8601
}

interface BPFile {
  mime: string
  hash: string
  name: string
}

const BASE_URL =
  'https://s18.buyplus1.com.tw/b/1301023989915468/admin/index.php'

export default class BuyPlusOneAPI {
  constructor(props: { initCookies?: Record<string, string> }) {
    httpClient.withBaseUrl(BASE_URL)
    if (props.initCookies) httpClient.withCookies(props.initCookies)
  }

  updatePhpsessId = (phpsessId: string) => {
    console.log('updatePhpsessId', phpsessId)
    httpClient.withCookie('__Secure-PHPSESSID', phpsessId)
  }

  obtaineToken = async (): Promise<string> => {
    console.log('Obtaine the buy+1 token...')
    const res = await httpClient.get('?route=common/dashboard')
    const $ = cheerio.load(res.data)
    const href = $('#header a.navbar-brand:first').attr('href') as string
    const token = qs.parse(href).token as string
    if (!token) {
      console.error('Failed to obtaine Buy+1 token', res.status, res.data)
      throw new Error('Failed to obtaine Buy+1 token.')
    }
    console.log('Successfully obtained Buy+1 token', token)
    return token
  }

  genProductId = async (token: string): Promise<string> => {
    console.log('Generate a new productId...')
    const productName = moment().valueOf().toString()
    let res = await httpClient.get(`?route=catalog/product/add&token=${token}`)
    let $ = cheerio.load(res.data)
    const productId = $('input[type="hidden"][name="product_id"]').val()
    const microtime = $('input[type="hidden"][name="microtime"]').val()
    const dateModified = $('input[type="hidden"][name="date_modified"]').val()

    const form = new FormData()
    form.append('product_id', productId)
    form.append('microtime', microtime)
    form.append('date_modified', dateModified)
    form.append('product_description[1][name]', productName)
    form.append('price', 1)
    form.append('cost', 0)
    form.append('quantity', 0)
    form.append('status', 1)
    form.append('image', '')
    form.append('product_description[1][description]', '')
    form.append('fb_groups_id', '913862951959460')
    form.append('location', '')
    form.append('shipping', 1)
    form.append('allow_import', 1)
    form.append('type', 1)
    form.append('product_store[]', 0)
    form.append('minimum', 1)
    form.append('subtract', 1)
    res = await httpClient.post(
      `?route=catalog/product/saveProduct&token=${token}`,
      form
    )
    console.log(res.status)

    res = await httpClient.get(
      `?route=catalog/product&token=${token}&sort=p.product_id&order=DESC&filter_name=${productName}`
    )
    $ = cheerio.load(res.data)
    return $('input[type="checkbox"].productSelected').val() as string
  }

  updateProduct = async (token: string, props: { product: Product }) => {
    console.log('updateProduct', props)
    const { product } = props
    if (!product.productId) throw new Error('product id cannot be undefined')
    const res = await httpClient.get(
      `?route=catalog/product/edit&product_id=${product.productId}&token=${token}`
    )
    const $ = cheerio.load(res.data)
    const microtime = $('input[type="hidden"][name="microtime"]').val()
    const dateModified = $('input[type="hidden"][name="date_modified"]').val()

    const saveProductUrl = `?route=catalog/product/saveProduct&token=${token}`

    const productId = product.productId
    const productName = product.name?.replace(
      '{{product-id}}',
      `S1-${productId}`
    )
    const productDesc = product.description?.replace(
      '{{product-id}}',
      `S1-${productId}`
    )
    const form = new FormData()
    form.append('product_id', productId)
    form.append('microtime', microtime ?? '')
    form.append('date_modified', dateModified ?? '')
    form.append('product_description[1][name]', productName)
    form.append('price', product.price)
    form.append('cost', product.cost)
    form.append('quantity', 0)
    form.append('status', 1)
    form.append('image', '')
    form.append('product_description[1][description]', productDesc)
    form.append('fb_groups_id', '913862951959460')
    form.append(
      'product_status_date',
      moment(product.statusDate).format('YYYY-MM-DD HH:mm')
    )
    form.append('location', product.location)
    form.append('shipping', 1)
    form.append('allow_import', 1)
    form.append('type', 1)
    form.append('product_store[]', 0)
    form.append('minimum', 1)
    form.append('subtract', 1)

    const saveProductResp = await httpClient.post(saveProductUrl, form)
    if (saveProductResp.data.success) console.log(saveProductResp.data.success)
    else console.log('更新失敗', saveProductResp.data)

    if (product.option)
      await this.saveProductOption(token, {
        productId: product.productId,
        productOption: product.option,
      })

    if (product.images)
      await this.updateProductImage(token, {
        productId: product.productId,
        imageUrl: product.images[0],
      })
  }

  quickUpdate = async (
    token: string,
    props: {
      id: string
      old?: string
      new: string
    }
  ) => {
    console.log('quickUpdate', props)
    const form = new FormData()
    form.append('id', props.id)
    form.append('old', props.old ?? '')
    form.append('new', props.new)
    form.append('lang_id', '1')
    const res = await httpClient.post(
      `?route=catalog/product/quick_update&token=${token}`,
      form
    )
    if (res?.data?.success === 1) console.log('Update completed.')
    else console.log('Update failed:', res?.data)
  }

  updateProductName = async (
    token: string,
    props: {
      productId: string
      value: string
    }
  ) => {
    console.log('updateProductName', props)
    await this.quickUpdate(token, {
      id: `name-${props.productId}`,
      new: props.value,
    })
  }

  updateProductPrice = async (
    token: string,
    props: {
      productId: string
      value: string
    }
  ) => {
    console.log('updateProductPrice', props)
    await this.quickUpdate(token, {
      id: `price-${props.productId}`,
      new: props.value,
    })
  }

  updateProductCost = async (
    token: string,
    props: {
      productId: string
      value: string
    }
  ) => {
    console.log('updateProductCost', props)
    await this.quickUpdate(token, {
      id: `cost-${props.productId}`,
      new: props.value,
    })
  }

  updateProductLocation = async (
    token: string,
    props: {
      productId: string
      value: string
    }
  ) => {
    console.log('updateProductLocation', props)
    await this.quickUpdate(token, {
      id: `location-${props.productId}`,
      new: props.value,
    })
  }

  updateProductStatus = async (
    token: string,
    props: {
      productId: string
      value: string
    }
  ) => {
    console.log('updateProductLocation', props)
    await this.quickUpdate(token, {
      id: `status-${props.productId}`,
      new: props.value,
    })
  }

  updateProductStatusDate = async (
    token: string,
    props: {
      productId: string
      value: string
    }
  ) => {
    console.log('updateProductStatusDate', props)
    const form = new FormData()
    form.append('product_ids', props.productId)
    form.append('product_date', props.value)
    const resopnse = await httpClient.post(
      `?route=catalog/product_ext/updateProductStatusDate&token=${token}`,
      form
    )
    if (resopnse.status === 200) console.log('Update completed.')
  }

  updateProductImage = async (
    token: string,
    props: {
      productId: string
      imageUrl: string
    }
  ) => {
    console.log('updateProductImage', props)
    const { productId, imageUrl } = props
    // download image
    console.log('Download image...')
    const response1 = await httpClient.get(imageUrl, {
      decompress: false,
      responseType: 'arraybuffer',
    })
    const imageData = response1.data
    console.log('Image download successful.')

    // get image dir
    const imageDir = await this.obtaineImageDir(token, {
      dirName: productId,
    })
    console.log('ImageDir', imageDir)

    // upload image
    console.log('Upload image...')
    const formData = new FormData()
    formData.append('cmd', 'upload')
    formData.append('target', imageDir.hash)
    formData.append('upload[]', imageData, `${Date.now()}.jpg`)
    const response2 = await httpClient.postForm(
      `?route=common/filemanager/connector&token=${token}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )
    const image = response2.data?.added?.[0]
    console.log('Image upload successful.', image)

    // update the image of product
    await this.quickUpdate(token, {
      id: `image-${productId}`,
      new: `catalog/upload/${productId}/${image.name}`,
    })
  }

  obtaineImageDir = async (
    token: string,
    props: { dirName: string }
  ): Promise<BPFile> => {
    console.log('obtaineImageDir', props)
    const { dirName } = props
    const res = await httpClient.get(
      `?route=common/filemanager/connector&token=${token}&cmd=open&target=l1_dXBsb2Fk&_=1676342825551`
    )
    const files: BPFile[] = res.data.files
    const maybeDir = files.find(
      f => f.mime === 'directory' && f.name === dirName
    )
    if (maybeDir) return maybeDir
    else return await this.createImageDir(token, { dirName })
  }

  createImageDir = async (
    token: string,
    props: { dirName: string }
  ): Promise<BPFile> => {
    console.log('createImageDir', props)
    const { dirName } = props
    const url =
      `?route=common/filemanager/connector&token=${token}` +
      `&cmd=mkdir&name=${dirName}&target=l1_dXBsb2Fk&_=${moment().valueOf()}}`
    const response = await httpClient.get(url)
    return response.data?.added?.[0]
  }

  saveProductOption = async (
    token: string,
    props: {
      productId: string
      productOption: string[][]
    }
  ) => {
    console.log('saveProductOption', props)
    const { productId, productOption } = props
    const form = new FormData()
    form.append('p_id', productId)
    form.append('microtime', '')
    for (let i = 0; i < productOption.length; i++) {
      form.append(`product_option[${i}][name]`, '手動輸入')
      form.append(`product_option[${i}][option_id]`, '1')
      form.append(`product_option[${i}][type]`, 'select')
      form.append(`product_option[${i}][required]`, '1')
      form.append(`product_option[${i}][product_option_value]`, '')
    }
    const url = `?route=catalog/product_ext/saveProductOption&token=${token}&batch_edit=1&selected=`
    await httpClient.post(url, form)

    for (let i = 0; i < productOption.length; i++) {
      const options = productOption[i]
      const form = new FormData()
      form.append('batch_edit', '1')
      form.append('selected', '')
      form.append('product_id', productId)
      form.append('microtime', '')
      form.append('table_index', i)
      form.append('options_count', productOption.length)
      form.append('options_index', i + 1)
      form.append('option_tr_count', options.length)
      form.append('option_tr_index', options.length)
      for (let i = 0; i < options.length; i++) {
        form.append(`options[${i}][subtract]`, 1)
        form.append(`options[${i}][price_prefix]`, '+')
        form.append(`options[${i}][cost_prefix]`, '+')
        form.append(`options[${i}][option_value_name]`, options[i])
        form.append(`options[${i}][product_option_value_id]`, '')
        form.append(`options[${i}][alias]`, '')
        form.append(`options[${i}][quantity]`, '0')
        form.append(`options[${i}][price]`, '0')
        form.append(`options[${i}][points_prefix]`, '')
        form.append(`options[${i}][points]`, '0')
        form.append(`options[${i}][weight_prefix]`, '')
        form.append(`options[${i}][weight]`, '0.00000000')
        form.append(`options[${i}][cost]`, '0')
      }
      const url = `?route=catalog/product_ext/saveProductOptionValue&token=${token}`
      const res = await httpClient.post(url, form)
      if (res?.data?.error) console.log('Save failed:', res?.data)
    }
  }

  publishToFB = async (
    token: string,
    props: {
      productId: string
      groupId?: string
    }
  ): Promise<string> => {
    console.log('publishToFB', props)
    const { productId, groupId = '913862951959460' } = props

    const res = await httpClient.get(
      `?route=catalog/product/postInFBGroup&token=${token}&product_id=${productId}&fb_group_id=${groupId}`
    )
    console.log('res.statusText', res.statusText)
    console.log('res.data', res.data)

    if (res.data?.error === '') console.log('Publish to FB completed.')
    else console.log('Publish to FB failed:', res.data)

    const status = res.data?.[0]?.status ?? ''
    const HREF_REGEX = /(href=")(.*)(">).*/
    const mo = status.match(HREF_REGEX)
    const href = mo && mo[2]
    return href ?? ''
  }
}
