/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly expose environment variables to the client
  env: {
    NEXT_PUBLIC_GOOGLE_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  // Add custom headers for Google Picker support
  async headers() {
    return [
      {
        // Apply to upload page specifically
        source: '/upload',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        child_process: false,
        http2: false,
        stream: false,
        crypto: false,
        os: false,
        path: false,
        zlib: false,
        querystring: false,
        buffer: false,
        util: false,
        url: false,
        assert: false,
        process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
