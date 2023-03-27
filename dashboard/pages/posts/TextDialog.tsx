import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Modal from '@mui/material/Modal'
import Typography from '@mui/material/Typography'
import axios from 'axios'
import { useEffect, useState } from 'react'

import { isValidHttpUrl } from '@/src/utils/urlUtils'

const TextDialog = (props: {
  open: boolean
  contentOrUrl: string | undefined
  handleClose: () => void
}) => {
  const { open, contentOrUrl, handleClose } = props
  const [content, setContent] = useState<string>()

  useEffect(() => {
    const loadData = async (url: string) => {
      const res = await axios.get(url)
      setContent(res.data)
    }

    if (contentOrUrl) {
      if (isValidHttpUrl(contentOrUrl)) loadData(contentOrUrl)
      else setContent(contentOrUrl)
    }
  }, [contentOrUrl])

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    height: '100%',
    bgcolor: 'background.paper',
    overflow: 'auto',
  }

  return (
    <div>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Button size="large" onClick={handleClose}>
            [關閉]
          </Button>
          <Divider />
          <Box sx={{ p: 1 }}>
            <Typography id="modal-modal-title" variant="body2" component="pre">
              {content}
            </Typography>
          </Box>
          <Divider />
          <Button size="large" onClick={handleClose}>
            [關閉]
          </Button>
        </Box>
      </Modal>
    </div>
  )
}

export default TextDialog
