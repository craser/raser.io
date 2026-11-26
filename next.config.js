const siteConfig = require('./siteconfig.json');

// Post title images live on the Bunny CDN. Next resizes them for each layout and caches the results
// on Vercel's CDN; lib/images/OptimizedImageHost.js decides which images are sent this way.
const titleImageHost = new URL(siteConfig.images.postcard).hostname;

module.exports = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: titleImageHost, pathname: '/**' }],
    formats: ['image/avif', 'image/webp'],
    qualities: [75],
    // A published image never changes, so keep each resized copy for 31 days rather than
    // re-making it (and spending another transformation from the plan's quota) every 4 hours.
    minimumCacheTTL: 2678400,
  },
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
