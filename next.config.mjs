/** @type {import('next').NextConfig} */
const nextConfig = {
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
