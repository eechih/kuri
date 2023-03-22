import * as cheerio from 'cheerio'
import FormData from 'form-data'
import moment from 'moment'
import qs from 'querystring'
import { getUniqueName } from '../libs/commomUtils'
import HttpClient from '../libs/httpClient'
import { Product } from './models'

const httpClient = new HttpClient()

httpClient.withBaseUrl(
  'https://s18.buyplus1.com.tw/b/1301023989915468/admin/index.php'
)

httpClient.withCookies({
  currency: 'TWD',
  __cf_bm:
    'fm6tnYUo5Wo0eiiz5CWhk7EelEex12l6T1m5ARyjzOo-1676599005-0-Abg15B7L3PsSJuuRn0rJ5ANT8xBrNGjSE0tsRvqKFYELBedGY8uKFbfs9j052EUPIBszoNdYArIJ74VNWplDnVKomnfcL//QtpyF1Qs05eEvBnvXbLHsJlpMmFiwwZbVHrSGaozpTHmBfP+ME5UfVqU=',
  '__Secure-PHPSESSID': 'hj0rbuamo1i5ojfunkfcoej3k5',
})

export default class ProductPublisher {
  private _token: string
  private _productId: string

  updateCookie = (props: { phpsessId: string }) => {
    console.log('ProductPublisher.updateCookie', props)
    httpClient.withCookie('__Secure-PHPSESSID', props.phpsessId)
  }

  refreshToken = async () => {
    console.log('ProductPublisher.refreshToken')
    const res = await httpClient.get('?route=common/dashboard')
    const $ = cheerio.load(res.data)
    const href = $('#header a.navbar-brand:first').attr('href') as string
    const token = qs.parse(href).token as string
    if (!token) {
      console.error('Failed to refresh token', res.status, res.data)
      throw new Error('Failed to refresh token.')
    }
    console.log('Successfully refreshed token.', token)
    this._token = token
  }

  private generateProductId = async () => {
    console.log('generateProductId')
    const token = this._token
    const name = getUniqueName('autogen')

    let res = await httpClient.get(`?route=catalog/product/add&token=${token}`)
    let $ = cheerio.load(res.data)
    const productId = $('input[type="hidden"][name="product_id"]').val()
    const microtime = $('input[type="hidden"][name="microtime"]').val()
    const dateModified = $('input[type="hidden"][name="date_modified"]').val()

    const form = new FormData()
    form.append('product_id', productId)
    form.append('microtime', microtime)
    form.append('date_modified', dateModified)
    form.append('product_description[1][name]', name)
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
      `?route=catalog/product&token=${token}&sort=p.product_id&order=DESC&filter_name=${name}`
    )
    $ = cheerio.load(res.data)
    const newProductId = $(
      'input[type="checkbox"].productSelected'
    ).val() as string

    if (!newProductId) {
      console.error('Failed to generate productId.', res.status, res.data)
      throw new Error('Failed to generate productId.')
    }

    console.log('Successfully generated productId.', newProductId)
    this._productId = newProductId
  }

  publishToBuyPlusOne = async (props: {
    data: PublishData
  }): Promise<PublishResult> => {
    console.log('ProductPublisher.publishToBuyPlusOne', props)
    try {
      await this.generateProductId()

      const { data } = props
      const productId = this._productId
      const token = this._token

      const res = await httpClient.get(
        `?route=catalog/product/edit&product_id=${productId}&token=${token}`
      )
      const $ = cheerio.load(res.data)
      const microtime = $('input[type="hidden"][name="microtime"]').val()
      const dateModified = $('input[type="hidden"][name="date_modified"]').val()

      const saveProductUrl = `?route=catalog/product/saveProduct&token=${token}`

      const updatedName = data.name?.replace(
        '{{product-id}}',
        `S1-${productId}`
      )
      const updatedDescription = data.description?.replace(
        '{{product-id}}',
        `S1-${productId}`
      )
      const form = new FormData()
      form.append('product_id', productId)
      form.append('microtime', microtime ?? '')
      form.append('date_modified', dateModified ?? '')
      form.append('product_description[1][name]', updatedName)
      form.append('price', data.price)
      form.append('cost', data.cost)
      form.append('quantity', 0)
      form.append('status', 1)
      form.append('image', '')
      form.append('product_description[1][description]', updatedDescription)
      form.append('fb_groups_id', '913862951959460')
      form.append(
        'product_status_date',
        moment(data.statusDate).format('YYYY-MM-DD HH:mm')
      )
      form.append('location', data.location)
      form.append('shipping', 1)
      form.append('allow_import', 1)
      form.append('type', 1)
      form.append('product_store[]', 0)
      form.append('minimum', 1)
      form.append('subtract', 1)

      const saveProductResp = await httpClient.post(saveProductUrl, form)
      if (!saveProductResp.data.success) {
        console.error('Failed to update Buy+1 product.', saveProductResp.data)
        throw new Error('Failed to update Buy+1 product.')
      }

      if (data.option)
        await this.saveProductOption({ productOption: data.option })

      if (data.images)
        await this.updateProductImage({ imageUrl: data.images[0] })

      console.log('Successfully published to Buy+1.')
      return {
        productId: this._productId,
        updatedName,
        updatedDescription,
      }
    } catch (err) {
      console.error('Failed to publish to Buy+1.', err)
      throw new Error('Failed to publish to Buy+1.')
    }
  }

  private quickUpdate = async (props: {
    id: string
    old?: string
    new: string
  }) => {
    console.log('quickUpdate', props)
    const token = this._token
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

  private updateProductName = async (props: {
    productId: string
    value: string
  }) => {
    console.log('updateProductName', props)
    await this.quickUpdate({
      id: `name-${props.productId}`,
      new: props.value,
    })
  }

  private updateProductPrice = async (props: {
    productId: string
    value: string
  }) => {
    console.log('updateProductPrice', props)
    await this.quickUpdate({
      id: `price-${props.productId}`,
      new: props.value,
    })
  }

  private updateProductCost = async (props: {
    productId: string
    value: string
  }) => {
    console.log('updateProductCost', props)
    await this.quickUpdate({
      id: `cost-${props.productId}`,
      new: props.value,
    })
  }

  private updateProductLocation = async (props: {
    productId: string
    value: string
  }) => {
    console.log('updateProductLocation', props)
    await this.quickUpdate({
      id: `location-${props.productId}`,
      new: props.value,
    })
  }

  private updateProductStatus = async (props: {
    productId: string
    value: string
  }) => {
    console.log('updateProductLocation', props)
    await this.quickUpdate({
      id: `status-${props.productId}`,
      new: props.value,
    })
  }

  private updateProductStatusDate = async (props: {
    productId: string
    value: string
  }) => {
    console.log('updateProductStatusDate', props)
    const token = this._token
    const form = new FormData()
    form.append('product_ids', props.productId)
    form.append('product_date', props.value)
    const resopnse = await httpClient.post(
      `?route=catalog/product_ext/updateProductStatusDate&token=${token}`,
      form
    )
    if (resopnse.status === 200) console.log('Update completed.')
  }

  private updateProductImage = async (props: { imageUrl: string }) => {
    console.log('updateProductImage', props)
    const productId = this._productId
    const token = this._token
    const { imageUrl } = props
    // download image
    console.log('Download image...')
    const response1 = await httpClient.get(imageUrl, {
      decompress: false,
      responseType: 'arraybuffer',
    })
    const imageData = response1.data
    console.log('Image download successful.')

    // get image dir
    const imageDir = await this.obtaineImageDir({
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
    await this.quickUpdate({
      id: `image-${productId}`,
      new: `catalog/upload/${productId}/${image.name}`,
    })
  }

  private obtaineImageDir = async (props: {
    dirName: string
  }): Promise<BPFile> => {
    console.log('obtaineImageDir', props)
    const token = this._token
    const { dirName } = props
    const res = await httpClient.get(
      `?route=common/filemanager/connector&token=${token}&cmd=open&target=l1_dXBsb2Fk&_=1676342825551`
    )
    const files: BPFile[] = res.data.files
    const maybeDir = files.find(
      f => f.mime === 'directory' && f.name === dirName
    )
    if (maybeDir) return maybeDir
    else return await this.createImageDir({ dirName })
  }

  private createImageDir = async (props: {
    dirName: string
  }): Promise<BPFile> => {
    console.log('createImageDir', props)
    const token = this._token
    const { dirName } = props
    const url =
      `?route=common/filemanager/connector&token=${token}` +
      `&cmd=mkdir&name=${dirName}&target=l1_dXBsb2Fk&_=${moment().valueOf()}}`
    const response = await httpClient.get(url)
    return response.data?.added?.[0]
  }

  private saveProductOption = async (props: { productOption: string[][] }) => {
    console.log('saveOption', props)
    const productId = this._productId
    const token = this._token
    const { productOption } = props
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

  publishToFB = async (props: { groupId: string }): Promise<string> => {
    console.log('ProductPublisher.publishToFB', props)
    try {
      const productId = this._productId
      const token = this._token
      const { groupId } = props

      const res = await httpClient.get(
        `?route=catalog/product/postInFBGroup&token=${token}&product_id=${productId}&fb_group_id=${groupId}`
      )
      console.log('res.statusText', res.statusText)
      console.log('res.data', res.data)

      if (res.data?.[0].error === '') {
        console.log('Successfully published to FB.')
      } else {
        throw new Error(res.data.error)
      }
      const status = res.data?.[0]?.status ?? ''
      const HREF_REGEX = /(href=")(.*)(">).*/
      const mo = status.match(HREF_REGEX)
      const href = mo && mo[2]

      return href ?? ''
    } catch (err) {
      console.error(err)
      throw new Error('Failed to publish to FB.')
    }
  }
}

type PublishData = Pick<
  Product,
  | 'name'
  | 'price'
  | 'cost'
  | 'option'
  | 'description'
  | 'location'
  | 'images'
  | 'status'
  | 'statusDate'
>

type PublishResult = {
  productId: string
  updatedName?: string
  updatedDescription?: string
}

type BPFile = {
  mime: string
  hash: string
  name: string
}
