/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic optimizations only
  compress: true,
  poweredByHeader: false,
  optimizeFonts: true,
  
  // Simple webpack optimization
  webpack: (config, { dev }) => {
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all'
      };
    }
    return config;
  },
  
  // Basic headers for caching and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://socs4all.sou.edu;",
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;