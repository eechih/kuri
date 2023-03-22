import Container from '@mui/material/Container'

interface LayoutProps {
  children: React.ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const Layout = ({ children, maxWidth = 'lg' }: LayoutProps) => {
  return (
    <>
      <Container maxWidth={maxWidth} sx={{ padding: 0 }}>
        {children}
      </Container>
    </>
  )
}

export default Layout
