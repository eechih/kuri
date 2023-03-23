import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import Product from 'models/product'
import moment from 'moment'
import { isEmpty } from 'ramda'
import { Controller, useForm } from 'react-hook-form'

interface ProductFormDialogProps {
  open: boolean
  formData: Product
  onClose: () => void
  onSubmit: (data: Product) => void
}

export default function ProductFormDialog(props: ProductFormDialogProps) {
  const { open, onClose, formData } = props

  const form = useForm<Product>({ defaultValues: formData ?? {} })

  const onSubmit = (data: Product) => {
    console.log('onSubmit', data)
    props.onSubmit({
      ...data,
      option: isEmpty(data.option) ? undefined : data.option,
      price: parseInt(`${data.price}`),
      cost: parseInt(`${data.cost}`),
    })
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>編輯商品</DialogTitle>
      <DialogContent>
        {/* <DialogContentText>{product.productMessage}</DialogContentText> */}
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Controller
            name="name"
            control={form.control}
            render={({ field }) => (
              <TextField
                autoFocus
                margin="dense"
                id={field.name}
                label="名稱"
                type="txt"
                fullWidth
                variant="standard"
                {...field}
              />
            )}
          />

          <Controller
            name="price"
            control={form.control}
            render={({ field }) => (
              <TextField
                autoFocus
                margin="dense"
                id={field.name}
                label="價格"
                type="number"
                fullWidth
                variant="standard"
                {...field}
              />
            )}
          />

          <Controller
            name="cost"
            control={form.control}
            render={({ field }) => (
              <TextField
                autoFocus
                margin="dense"
                id={field.name}
                label="成本"
                type="number"
                fullWidth
                variant="standard"
                {...field}
              />
            )}
          />

          <Controller
            name="option"
            control={form.control}
            render={({ field: { name, value, onChange, onBlur } }) => (
              <TextField
                autoFocus
                margin="dense"
                id={name}
                label="規格"
                type="text"
                fullWidth
                variant="standard"
                placeholder="範例：紅，黑 / L，M，S"
                value={formatProductOption(value)}
                name={name}
                onChange={e => onChange(parseProductOption(e.target.value))}
                onBlur={onBlur}
              />
            )}
          />

          <Controller
            name="statusDate"
            control={form.control}
            render={({ field: { name, value, onChange, onBlur } }) => (
              <TextField
                autoFocus
                margin="dense"
                id={name}
                label="收單日期"
                type="datetime-local"
                fullWidth
                variant="standard"
                value={formatProductStatusDate(value)}
                name={name}
                onChange={onChange}
                onBlur={onBlur}
              />
            )}
          />

          <Controller
            name="description"
            control={form.control}
            render={({ field }) => (
              <TextField
                autoFocus
                margin="dense"
                id={field.name}
                label="貼文內容"
                type="text"
                fullWidth
                variant="standard"
                multiline
                rows={12}
                {...field}
              />
            )}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={form.handleSubmit(onSubmit)}>儲存</Button>
      </DialogActions>
    </Dialog>
  )
}

const formatProductOption = (input?: string[][]): string => {
  if (!input) return ''
  return input.map(option => option.join('，')).join(' / ')
}

const parseProductOption = (input: string): string[][] | undefined => {
  return input
    .trim()
    .split('/')
    .filter(s => !isEmpty(s.trim()))
    .map(s => s.split(/[,，]/).filter(s => !isEmpty(s.trim())))
}

const formatProductStatusDate = (input?: string): string => {
  if (!input) return ''
  return moment(input).utcOffset(8).format('yyyy-MM-DDTHH:mm')
}
