import Layout from '@/src/components/Layout'
import Post from '@/src/models/post'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import { styled } from '@mui/material/styles'
import axios, { AxiosError, isAxiosError } from 'axios'
import { compare } from 'fast-json-patch'
import moment from 'moment'
import { useRouter } from 'next/router'
import { ParsedUrlQuery } from 'querystring'
import { isEmpty } from 'ramda'
import { useEffect, useState } from 'react'

import Breadcrumbs from '@/src/components/Breadcrumbs'
import { useLoadingReducer } from '@/src/hooks'
import { convertToProduct } from '@/src/utils/converters'
import PostFormDialog from './PostFormDialog'
import PostItem, {
  OnCreateProductButtonClickFunc,
  OnEditButtonClickFunc,
  OnOriginPostButtonClickFunc,
} from './PostItem'
import TextDialog from './TextDialog'

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  textAlign: 'left',
  color: theme.palette.text.secondary,
}))

type Query = {
  groupId?: string
  limit: number
  order: string
}

export default function Index() {
  const router = useRouter()
  const [loadingState, setLoadingState] = useLoadingReducer()
  const [posts, setPosts] = useState<Post[]>([])
  const [postToEdit, setPostToEdit] = useState<Post | null>(null)
  const [postToReview, setPostToReview] = useState<Post | null>(null)

  useEffect(() => {
    if (router.isReady) {
      const { limit, order } = router.query
      if (!limit || !order) {
        router.push({
          query: {
            ...router.query,
            limit: limit ?? '10',
            order: order ?? 'desc',
          },
        })
      }
    }
  }, [router])

  useEffect(() => {
    async function listPosts(query: ParsedUrlQuery) {
      console.log('listPosts', query)
      try {
        setLoadingState({ loading: true, error: null })
        const res = await axios.get('/api/posts', { params: query })
        const posts = res.data.items ?? []
        setPosts(posts)
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

    if (!isEmpty(router.query)) listPosts(router.query)
  }, [router.query, setLoadingState])

  const createProductFromPost = async (post: Post) => {
    console.log('createProductFromPost', post)
    try {
      const product = convertToProduct({ post })
      // create new product
      const res = await axios.post('/api/products', product)
      const { productId } = res.data
      console.log('productId', productId)
      if (productId) {
        const { postId } = post
        await axios.patch(`/api/posts/${postId}`, [
          { op: 'add', path: '/productId', value: productId },
        ])
        setPosts(
          posts.map(post =>
            post.postId == postId ? { ...post, productId: productId } : post
          )
        )
        console.log('上架成功')
      }
    } catch (err) {
      if (isAxiosError(err)) {
        const axiosError = err as AxiosError
        console.error(axiosError.response)
      } else {
        console.error(err)
      }
    }
  }

  const onCreateProductButtonClick: OnCreateProductButtonClickFunc = async (
    post: Post
  ): Promise<void> => {}

  const onEditButtonClick: OnEditButtonClickFunc = async (props: {
    postId: string
  }): Promise<void> => {
    console.log('onEditButtonClick', props)
    const { postId } = props
    const post = posts.find(post => post.postId == postId)
    if (post) setPostToEdit(post)
  }

  const onOriginPostButtonClick: OnOriginPostButtonClickFunc = async (props: {
    postId: string
  }): Promise<void> => {
    console.log('onOriginPostButtonClick', props)
    const { postId } = props
    const post = posts.find(post => post.postId == postId)
    if (post) setPostToReview(post)
  }

  const savePost = async (postToUpdate: Post) => {
    console.log('savePost', postToUpdate)
    try {
      const { postId } = postToUpdate
      const post = posts.find(post => post.postId == postId)
      if (post) {
        const patches = compare(post, postToUpdate)
        console.log('patches', patches)
        if (!isEmpty(patches)) {
          const res = await axios.patch(`/api/posts/${postId}`, patches)
          const updatedPost = res.data
          setPosts(
            posts.map(post => (post.postId == postId ? updatedPost : post))
          )
          console.log('儲存成功')
        }
      }
      setPostToEdit(null)
    } catch (err) {
      if (isAxiosError(err)) {
        const axiosError = err as AxiosError
        console.error(axiosError.response)
      } else {
        console.error(err)
      }
    }
  }

  return (
    <Layout maxWidth="xs">
      <Box sx={{ width: '400' }}>
        <Breadcrumbs
          breadcrumbs={[{ label: '首頁', href: '/' }, { label: '貼文' }]}
        />
        <Stack spacing={1}>
          {posts.map(post => (
            <Item key={post.postId}>
              <PostItem
                post={post}
                onCreateProductButtonClick={post => createProductFromPost(post)}
                onEditButtonClick={onEditButtonClick}
                onOriginPostButtonClick={onOriginPostButtonClick}
              />
            </Item>
          ))}
        </Stack>
      </Box>
      {!!postToEdit && (
        <PostFormDialog
          open={!!postToEdit}
          formData={postToEdit}
          onClose={() => setPostToEdit(null)}
          onSubmit={savePost}
        />
      )}

      <TextDialog
        open={!!postToReview}
        contentOrUrl={postToReview?.postUrl}
        handleClose={() => setPostToReview(null)}
      />
    </Layout>
  )
}
