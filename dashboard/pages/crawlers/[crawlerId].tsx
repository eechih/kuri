import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import axios, { AxiosError, isAxiosError } from 'axios'
import moment from 'moment'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import Breadcrumbs from '../../components/Breadcrumbs'
import Layout from '../../components/Layout'
import RefreshIconButton from '../../components/RefreshIconButton'
import Crawler from '../../models/crawler'
import StateLabel from './StateLabel'

export default function Index() {
  const router = useRouter()
  const crawlerId = router.query.crawlerId as string
  const [crawler, setCrawler] = useState<Crawler>()
  const [loading, setLoading] = useState<boolean>(false)
  const [loadedTime, setLoadedTime] = useState<string>()

  useEffect(() => {
    if (crawlerId) getCrawler(crawlerId)
  }, [crawlerId])

  const getCrawler = async (crawlerId: string) => {
    console.log('getCrawler', crawlerId)
    try {
      setLoading(true)
      const res = await axios.get(`/api/crawlers/${crawlerId}`)
      const crawler = res.data
      if (crawler) {
        setCrawler(crawler)
        setLoadedTime(moment().format('yyyy-MM-DD HH:mm:ss'))
      }
    } catch (err) {
      if (isAxiosError(err)) {
        const axiosError = err as AxiosError
        console.error(axiosError.response)
      } else {
        console.error(err)
      }
    }
    setLoading(false)
  }

  return (
    <Layout>
      <Breadcrumbs
        breadcrumbs={[
          { label: '首頁', href: '/' },
          { label: '爬蟲', href: '/crawlers' },
          { label: crawlerId },
        ]}
      />
      <Paper>
        <Box p={2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">爬蟲 {crawlerId}</Typography>

            <RefreshIconButton
              onClick={() => getCrawler(crawlerId)}
              loading={loading}
            />
          </Stack>
        </Box>

        {!crawler && (
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            spacing={2}
            height={100}
          >
            <CircularProgress size={30} />
          </Stack>
        )}

        {crawler && (
          <Box p={2}>
            <Stack
              justifyContent="flex-start"
              alignItems="flex-start"
              spacing={2}
            >
              <Stack>
                <Typography variant="subtitle2">建立時間</Typography>
                <Typography variant="overline">
                  {crawler.creationTime
                    ? moment(crawler.creationTime).format('yyyy-MM-DD HH:mm:ss')
                    : '-'}
                </Typography>
              </Stack>

              <Stack>
                <Typography variant="subtitle2">爬蟲狀態</Typography>
                <Box my={0.5}>
                  <StateLabel state={crawler.state} />
                </Box>
              </Stack>

              <Stack>
                <Typography variant="subtitle2">爬蟲參數</Typography>
                <Typography variant="overline">
                  {crawler.messageBody}
                </Typography>
              </Stack>

              {crawler.processingTime && (
                <Stack>
                  <Typography variant="subtitle2">啟動時間</Typography>
                  <Typography variant="overline">
                    {moment(crawler.processingTime).format(
                      'yyyy-MM-DD HH:mm:ss'
                    )}
                  </Typography>
                </Stack>
              )}

              {crawler.completedTime && (
                <Stack>
                  <Typography variant="subtitle2">成功時間</Typography>
                  <Typography variant="overline">
                    {moment(crawler.completedTime).format(
                      'yyyy-MM-DD HH:mm:ss'
                    )}
                  </Typography>
                </Stack>
              )}

              {crawler.failedTime && (
                <Stack>
                  <Typography variant="subtitle2">失敗時間</Typography>
                  <Typography variant="overline">
                    {moment(crawler.failedTime).format('yyyy-MM-DD HH:mm:ss')}
                  </Typography>
                </Stack>
              )}

              {crawler.tracing && (
                <Stack>
                  <Typography variant="subtitle2">結果</Typography>
                  <Typography variant="overline">{crawler.tracing}</Typography>
                </Stack>
              )}
            </Stack>
          </Box>
        )}
      </Paper>
      <Stack direction="row" justifyContent="flex-end" my={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="caption" color="#9e9e9e">
            資料取得時間
          </Typography>
          <Typography variant="caption" color="#9e9e9e">
            {loadedTime}
          </Typography>
        </Stack>
      </Stack>
    </Layout>
  )
}
