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
import Link from 'next/link'
import * as React from 'react'

import Breadcrumbs from '@/src/components/Breadcrumbs'
import Layout from '@/src/components/Layout'
import RefreshIconButton from '@/src/components/RefreshIconButton'
import Crawler from '@/src/models/crawler'
import moment from 'moment'
import StateLabel from './StateLabel'

export default function Index() {
  const [crawlers, setCrawlers] = React.useState<Crawler[]>()
  const [loading, setLoading] = React.useState<boolean>()
  const [loadedTime, setLoadedTime] = React.useState<string>()

  const listCrawlers = async () => {
    console.log('listCrawlers')
    setLoading(true)
    try {
      const res = await axios.get('/api/crawlers', {
        params: { limit: 10, order: 'desc' },
      })
      const crawlers = res.data.items
      if (crawlers) {
        setCrawlers(crawlers)
        setLoadedTime(moment().format())
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

  React.useEffect(() => {
    listCrawlers()
  }, [])

  const createCrawler = async () => {
    console.log('createCrawler')
    try {
      const postData = {
        groupId: '1627303077535381',
        limit: 20,
      }
      const res = await axios.post('/api/crawlers', postData, {
        params: { crawlerName: 'Facebook' },
      })
      const crawler = res.data
      if (crawler) {
        setCrawlers(crawlers ? [crawler, ...crawlers] : [crawler])
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
  }

  return (
    <Layout>
      <Box m={1}>
        <Breadcrumbs
          breadcrumbs={[{ label: '首頁', href: '/' }, { label: '爬蟲' }]}
        />
        <Stack
          direction="row"
          justifyContent="space-between"
          sx={{ pt: 2, pb: 2 }}
        >
          <Stack direction="row" spacing={1}>
            <Typography variant="h6">爬蟲</Typography>
            <Typography variant="h6" color="gray">
              ({crawlers ? crawlers.length : 0})
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <RefreshIconButton onClick={listCrawlers} loading={loading} />
            <Button size="small" variant="outlined" onClick={createCrawler}>
              建立爬蟲
            </Button>
          </Stack>
        </Stack>

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {!crawlers && loading && (
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
          {crawlers && (
            <TableContainer sx={{ width: '100%', overflow: 'auto' }}>
              <Table size="small" stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    <TableCell style={{ minWidth: 60 }}>
                      <Checkbox color="primary" />
                    </TableCell>
                    <TableCell style={{ minWidth: 140 }}>爬蟲編號</TableCell>
                    <TableCell style={{ minWidth: 100 }}>狀態</TableCell>
                    <TableCell style={{ minWidth: 190 }}>建立時間</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {crawlers.map(crawler => {
                    const { crawlerId, state, creationTime } = crawler
                    return (
                      <TableRow
                        hover
                        role="checkbox"
                        tabIndex={-1}
                        key={crawlerId}
                      >
                        <TableCell>
                          <Checkbox color="primary" />
                        </TableCell>
                        <TableCell>
                          <Link href={`/crawlers/${crawlerId}`}>
                            <Typography
                              variant="body2"
                              sx={{ color: '#1976d2' }}
                            >
                              {crawlerId}
                            </Typography>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <StateLabel state={state} />
                        </TableCell>
                        <TableCell>
                          {creationTime
                            ? moment(creationTime).format('yyyy-MM-DD HH:mm:ss')
                            : '-'}
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
              {loadedTime}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Layout>
  )
}
