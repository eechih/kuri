import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import PendingIcon from '@mui/icons-material/Pending'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export default function StateLabel(props: { state: string }) {
  let icon
  let label
  let color

  const state = props.state
  if (state == 'Processing') {
    icon = <PlayCircleOutlineIcon fontSize="small" color="primary" />
    label = '進行中'
    color = '#1976d2'
  } else if (state == 'Completed') {
    icon = <CheckCircleOutlineIcon fontSize="small" color="success" />
    label = '成功'
    color = '#2e7d32'
  } else if (state == 'Failed') {
    icon = <ErrorOutlineIcon fontSize="small" color="error" />
    label = '失敗'
    color = '#d32f2f'
  } else {
    icon = <PendingIcon fontSize="small" />
    label = '等待'
  }

  return (
    <Stack
      direction="row"
      justifyContent="flex-start"
      alignItems="center"
      spacing={0.5}
    >
      {icon}
      <Typography variant="body2" color={color}>
        {label}
      </Typography>
    </Stack>
  )
}
