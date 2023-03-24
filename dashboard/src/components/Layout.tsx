import Container from '@mui/material/Container'
import Header from './Header'

interface LayoutProps {
  children: React.ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const Layout = ({ children, maxWidth = 'lg' }: LayoutProps) => {
  return (
    <>
      <Container maxWidth={maxWidth} sx={{ padding: 0 }}>
        <Header />
        {children}
      </Container>
    </>
  )
}

export default Layout
