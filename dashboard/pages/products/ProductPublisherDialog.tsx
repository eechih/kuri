import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'

import { useLoadingReducer } from '@/src/hooks'
import Product from '@/src/models/product'

interface ProductPublisherDialogProps {
  open: boolean
  products: Product[]
  onSuccess?: () => void
  onFailed?: () => void
  onClose?: () => void
}

export default function ProductPublisherDialog(
  props: ProductPublisherDialogProps
) {
  const { open, onClose, products = [] } = props
  const [loadingState, setLoadingState] = useLoadingReducer()

  const publish = () => {
    console.log('publish')
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>發佈商品</DialogTitle>
      <DialogContent>
        {products.map(product => product.productId).join(', ')}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={onClose}>啟動</Button>
      </DialogActions>
    </Dialog>
  )
}
