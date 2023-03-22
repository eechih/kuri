import { PutObjectCommand } from '@aws-sdk/client-s3'
import axios from 'axios'
import { Md5 } from 'ts-md5'
import { DEFAULT_REGION } from '../libs'
import { s3Client } from '../libs/s3Client'
import { analyse } from './analyser'
import { Post } from './models'

const parseJsonToPost = (props: { jsonString: string }): Post => {
  console.log('parseJsonToPost', props)
  const payload = JSON.parse(props.jsonString)
  return {
    userId: payload.userId ?? '',
    postId: payload.postId ?? '',
    postURL: payload.wwwURL ?? '',
    postMessage: payload.message,
    postImages: payload.photoImages ?? [],
    postCreationTime: payload.creationTime ?? '',
    postCrawledTime: payload.crawledTime ?? '',
    groupId: payload.groupId ?? '',
    groupName: payload.groupName ?? '',
  }
}

const analysePost = (props: { post: Post }): Post => {
  console.log('analysePost', props)
  return analyse(props.post)
}

const downloadImagesAndUploadToS3 = async (props: {
  bucketName: string
  userId: string
  groupId: string
  postId: string
  postImages: string[]
}): Promise<string[]> => {
  console.log('downloadImagesAndUploadToS3', props)
  const { bucketName, userId, groupId, postId, postImages } = props
  return await Promise.all(
    postImages.map(async (imageUrl: string) => {
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

export { analysePost, downloadImagesAndUploadToS3, parseJsonToPost }
