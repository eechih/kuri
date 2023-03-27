import { PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3'
import axios from 'axios'
import { Md5 } from 'ts-md5'
import { DEFAULT_REGION } from '../libs'
import { s3Client } from '../libs/s3Client'
import { analyse } from './analyser'
import { CrawledPost, Post } from './models'

const analysePost = (props: { crawledPost: CrawledPost }): Post => {
  console.log('analysePost', props)
  return analyse(props.crawledPost)
}

const uploadPostMessageToS3 = async (props: {
  bucketName: string
  userId: string
  groupId: string
  postId: string
  postMessage?: string
}): Promise<string | undefined> => {
  console.log('uploadPostMessageToS3', props)
  const { bucketName, userId, groupId, postId, postMessage } = props
  if (postMessage) {
    try {
      const input: PutObjectCommandInput = {
        Bucket: bucketName,
        Key: `${userId}/${groupId}/${postId}/message.txt`,
        Body: postMessage,
        ACL: 'public-read',
      }
      await s3Client.send(new PutObjectCommand(input))
      console.log(`Successfully uploaded object: ${input.Bucket}/${input.Key}`)
      const href = 'https://s3.' + DEFAULT_REGION + '.amazonaws.com/'
      const bucketUrl = href + bucketName + '/'
      return bucketUrl + input.Key
    } catch (error) {
      console.log('Upload to S3 failed.', error)
    }
  }
  return undefined
}

const downloadImagesAndUploadToS3 = async (props: {
  bucketName: string
  userId: string
  groupId: string
  postId: string
  imageUrls: string[]
}): Promise<string[]> => {
  console.log('downloadImagesAndUploadToS3', props)
  const { bucketName, userId, groupId, postId, imageUrls } = props
  return await Promise.all(
    imageUrls.map(async (imageUrl: string) => {
      let productImageUrl = ''
      try {
        const response = await axios.get(imageUrl, {
          decompress: false,
          responseType: 'arraybuffer',
        })

        const uploadParams = {
          Bucket: bucketName,
          Key: `${userId}/${groupId}/${postId}/${Md5.hashStr(imageUrl)}.jpg`,
          Body: response.data,
          ACL: 'public-read',
        }
        await s3Client.send(new PutObjectCommand(uploadParams))
        console.log(
          `Successfully uploaded object: ${uploadParams.Bucket}/${uploadParams.Key}`
        )
        const href = 'https://s3.' + DEFAULT_REGION + '.amazonaws.com/'
        const bucketUrl = href + bucketName + '/'
        productImageUrl = bucketUrl + uploadParams.Key
      } catch (error) {
        console.log('Upload to S3 failed.', error)
        productImageUrl = 'Upload to S3 failed.'
      }
      return productImageUrl
    })
  )
}

export { analysePost, uploadPostMessageToS3, downloadImagesAndUploadToS3 }
