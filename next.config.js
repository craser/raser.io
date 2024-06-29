module.exports = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/home/archive/:path*',
        destination: '/archive/:path*',
        permanent: true
      },
      {
        source: '/home/:path*',
        destination: '/',
        permanent: true
      }
    ]
  }
}
