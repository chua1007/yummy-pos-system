/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@yummy/ui', '@yummy/types'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.yummy.io',
      },
    ],
  },
};

export default nextConfig;
