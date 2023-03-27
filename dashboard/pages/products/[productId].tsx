import Product from '@/src/models/product'
import axios, { AxiosError, isAxiosError } from 'axios'
import moment from 'moment'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { useLoadingReducer } from '@/src/hooks'

export default function Index() {
  const router = useRouter()
  const [loadingState, setLoadingState] = useLoadingReducer()
  const [product, setProduct] = useState<Product>()

  const getProduct = async (productId: string): Promise<Product> => {
    const res = await axios.get<Product>(`/api/products/${productId}`)
    return res.data
  }

  useEffect(() => {
    const loadData = async (productId: string) => {
      try {
        setLoadingState({ loading: true, error: null })
        const product = await getProduct(productId)
        setProduct(product)
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

    if (router.isReady) {
      const { productId } = router.query as { productId: string }
      loadData(productId)
    }
  }, [router, setLoadingState])

  if (loadingState.loading) return <>Loading...</>

  if (!product) return <>Product not found.</>

  return <>{JSON.stringify(product)}</>
}
