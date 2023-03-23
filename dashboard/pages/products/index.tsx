import LoadingButton from '@mui/lab/LoadingButton'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import axios, { AxiosError, isAxiosError } from 'axios'
import { compare } from 'fast-json-patch'
import moment, { Moment } from 'moment'
import Link from 'next/link'
import { find, isEmpty, propEq, reject } from 'ramda'
import { useEffect, useState } from 'react'

import Breadcrumbs from 'components/Breadcrumbs'
import Layout from 'components/Layout'
import RefreshIconButton from 'components/RefreshIconButton'
import { useLoadingReducer } from 'hooks'
import Product from 'models/product'
import ProductFormDialog from './ProductFormDialog'
import ProductPublisherDialog from './ProductPublisherDialog'

type Query = {
  limit: number
  order: string
  refreshTime?: Moment
}

export default function Index() {
  const [query, setQuery] = useState<Query>({ limit: 20, order: 'desc' })
  const [loadingState, setLoadingState] = useLoadingReducer()
  const [products, setProducts] = useState<Product[]>([])
  const [productToEdit, setProductToEdit] = useState<Product | null>(null)
  const [checked, setChecked] = useState<string[]>([])
  const [productsToPublish, setProductsToPublish] = useState<Product[] | null>(
    null
  )

  useEffect(() => {
    async function listProducts() {
      console.log('listProducts')
      try {
        setLoadingState({ loading: true, error: null })
        const res = await axios.get('/api/products', { params: query })
        const products = res.data.items
        setProducts(products)
        setLoadingState({ loading: false, loaded: true, loadedTime: moment() })
      } catch (err) {
        if (isAxiosError(err)) {
          const axiosError = err as AxiosError
          console.error(axiosError.response)
        } else {
          console.error(err)
        }
        setLoadingState({ loading: false, error: err as Error })
      }
    }

    listProducts()
  }, [query, setLoadingState])

  const handleRefreshButtonClick = async () => {
    console.log('handleRefreshButtonClick')
    setQuery({ ...query, refreshTime: moment() })
  }

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.name) {
      if (event.target.checked) {
        if (!find(v => v === event.target.name, checked))
          setChecked([...checked, event.target.name].sort())
      } else {
        setChecked(reject(v => v === event.target.name, checked))
      }
    }
  }

  const publishProduct = async (productId: string) => {
    console.log('publishProduct', productId)
    try {
      await axios.put(`/api/products/${productId}/publish`, undefined, {
        params: { phpsessId: 'tbo311ajis0n5p9ni2re6l1t26' },
        timeout: 60000, // 60 seconds
      })

      const newProducts = products.map(product => {
        return product.productId == productId
          ? { ...product, publishing: true }
          : product
      })

      setProducts(newProducts)
    } catch (err) {
      console.error(err)
    }
  }

  const updateProduct = async (productToUpdate: Product) => {
    console.log('updateProduct', productToUpdate)
    try {
      const { productId } = productToUpdate
      const product = find(propEq('productId', productId))(products) as Product
      if (!product) throw new Error('Product not found.')
      const patches = compare(product, productToUpdate)
      console.log('patches', patches)
      if (isEmpty(patches)) {
        console.log('No any changed.')
        setProductToEdit(null)
        return
      }
      const res = await axios.patch(`/api/products/${productId}`, patches)
      const patchedProduct = res.data
      setProducts(
        products.map(product =>
          product.productId == productId ? patchedProduct : product
        )
      )
      console.log('儲存成功')
      setProductToEdit(null)
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  return (
    <Layout>
      <Box m={1}>
        <Breadcrumbs
          breadcrumbs={[{ label: '首頁', href: '/' }, { label: '商品管理' }]}
        />
        <Stack
          direction="row"
          justifyContent="space-between"
          sx={{ pt: 2, pb: 2 }}
        >
          <Stack>
            <Typography variant="h6" gutterBottom>
              商品管理
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <RefreshIconButton
              onClick={handleRefreshButtonClick}
              loading={loadingState.loading}
            />
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                console.log('createProduct')
              }}
            >
              建立商品
            </Button>
            <Button
              disabled={!checked || checked.length == 0}
              size="small"
              variant="outlined"
              onClick={() => {
                console.log('createProduct')
                const checkedProducts = products.filter(({ productId }) => {
                  return checked.includes(productId)
                })
                setProductsToPublish(checkedProducts)
              }}
            >
              發佈商品
            </Button>
          </Stack>
        </Stack>

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {!products && (
            <Stack
              direction="row"
              justifyContent="center"
              alignItems="center"
              spacing={2}
              height={440}
            >
              <CircularProgress size={30} />
            </Stack>
          )}
          {products && (
            <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
              <Table size="small" stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    <TableCell style={{ minWidth: 40 }}>
                      <Checkbox color="primary" disabled />
                    </TableCell>
                    <TableCell style={{ minWidth: 60 }}>商品ID</TableCell>
                    <TableCell style={{ minWidth: 400 }}>名稱</TableCell>
                    <TableCell style={{ minWidth: 80 }}>價格</TableCell>
                    <TableCell style={{ minWidth: 80 }}>廠商</TableCell>
                    <TableCell style={{ minWidth: 80 }}>成本</TableCell>
                    <TableCell style={{ minWidth: 170 }}>下架時間</TableCell>
                    <TableCell style={{ minWidth: 80 }}></TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {products.map(product => {
                    const {
                      productId,
                      name,
                      price,
                      cost,
                      location,
                      statusDate,
                      publishing,
                      publishedPostId,
                    } = product
                    return (
                      <TableRow
                        hover
                        role="checkbox"
                        tabIndex={-1}
                        key={productId}
                      >
                        <TableCell>
                          <Checkbox
                            name={productId}
                            color="primary"
                            onChange={handleCheckboxChange}
                          />
                        </TableCell>
                        <TableCell>
                          <Link href={`/products/${productId}`}>
                            <Typography
                              variant="body2"
                              sx={{ color: '#1976d2' }}
                            >
                              {productId.substring(0, 8)}
                            </Typography>
                          </Link>
                        </TableCell>
                        <TableCell>{name}</TableCell>
                        <TableCell>{price}</TableCell>
                        <TableCell>{location}</TableCell>
                        <TableCell>{cost}</TableCell>
                        <TableCell>
                          {moment(statusDate).format('yyyy/MM/DD HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row">
                            <Button onClick={() => setProductToEdit(product)}>
                              編輯
                            </Button>
                            <LoadingButton
                              loading={publishing}
                              variant={!!publishedPostId ? 'text' : 'contained'}
                              disabled={!!publishedPostId}
                              onClick={() => {
                                publishProduct(productId)
                              }}
                            >
                              {publishedPostId ? '已發佈' : '發佈'}
                            </LoadingButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Stack direction="row" justifyContent="flex-end" my={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" color="#9e9e9e">
              資料取得時間
            </Typography>
            <Typography variant="caption" color="#9e9e9e">
              {loadingState.loadedTime
                ? moment(loadingState.loadedTime).format('yyyy-MM-DD HH:mm:ss')
                : '-'}
            </Typography>
          </Stack>
        </Stack>
      </Box>
      {checked.join(', ')}
      {productToEdit && (
        <ProductFormDialog
          open={true}
          formData={productToEdit}
          onClose={() => setProductToEdit(null)}
          onSubmit={data => updateProduct(data)}
        />
      )}
      {productsToPublish && (
        <ProductPublisherDialog
          open={true}
          products={productsToPublish}
          onClose={() => setProductsToPublish(null)}
        />
      )}
    </Layout>
  )
}
