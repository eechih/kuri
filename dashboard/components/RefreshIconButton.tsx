import RefreshIcon from '@mui/icons-material/Refresh'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'

export default function RefreshIconButton(props: {
  onClick: () => void
  loading?: boolean
}) {
  const { onClick, loading = false } = props
  return (
    <IconButton
      onClick={onClick}
      sx={{
        width: 48,
        textAlign: 'center',
        border: '1px outset grey',
        borderRadius: 1,
      }}
      disabled={loading}
    >
      {(loading && <CircularProgress size={20} />) || (
        <RefreshIcon fontSize="small" />
      )}
    </IconButton>
  )
}
