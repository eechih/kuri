import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import * as React from 'react'

const WrapTypography = ({ text }: { text: string }) => {
  if (text.trim() === '') return <br />
  return (
    <Typography variant="body2" gutterBottom component="p">
      {text}
    </Typography>
  )
}

interface TextAccordionProps {
  text: string
}

const TextAccordion = ({ text }: TextAccordionProps) => {
  const [expanded, setExpanded] = React.useState(false)

  let lines = text.split('\n')
  if (!expanded) lines = lines.slice(0, 6)

  return (
    <React.Fragment>
      <Box>
        {lines.map((line, index) => (
          <WrapTypography key={index} text={line} />
        ))}
        {expanded || (
          <Button
            size="small"
            variant="text"
            color="inherit"
            onClick={() => setExpanded(true)}
            sx={{ padding: 0 }}
          >
            ... 顯示更多
          </Button>
        )}
      </Box>
      {/* 
      {(expanded && (
        <Box>
          {fullLines.map((s, index) => (
            <WrapTypography key={index} text={s} />
          ))}
        </Box>
      )) || (
        <Box>
          {partialLines.map((s, index) => (
            <WrapTypography key={index} text={s} />
          ))}
          ...
          <Button
            size="small"
            variant="text"
            color="inherit"
            onClick={() => setExpanded(true)}
          >
            顯示更多
          </Button>
        </Box> */}
      {/* )} */}
    </React.Fragment>
  )
}

export default TextAccordion
