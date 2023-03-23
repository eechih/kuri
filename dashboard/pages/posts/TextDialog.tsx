import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'

import Modal from '@mui/material/Modal'

import Typography from '@mui/material/Typography'

const TextDialog = (props: {
  open: boolean
  content: string | undefined
  handleClose: () => void
}) => {
  const { open, content, handleClose } = props

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
