/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['s3.us-east-1.amazonaws.com'],
  },
  async rewrites() {
    const beforeFiles = []
    if (process.env.API_URL) {
      console.log('API_URL', process.env.API_URL)
      beforeFiles.push({
        source: '/api/:path*',
        destination: process.env.API_URL + '/:path*',
      })
    }
    console.log('beforeFiles', beforeFiles)
    return {
      beforeFiles: beforeFiles,
      afterFiles: [],
      fallback: [],
    }
    // return beforeFiles
  },
}

module.exports = nextConfig
