import '@/styles/globals.css'
import type { AppProps } from 'next/app'

// Global axios defaults
// axios.defaults.baseURL = '/api'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
