import type { NextConfig } from 'next';

const storageType = process.env.STORAGE_TYPE ?? 'minio';
// @ts-ignore: remotePatterns exists at runtime
const remotePatterns: NextConfig['images']['remotePatterns'] = [];  

if (storageType === 'minio') {
  const hostname = process.env.MINIO_ENDPOINT ?? 'localhost';
  const port = process.env.MINIO_PORT ?? '9000';
  remotePatterns.push({ protocol: 'http', hostname, port });
}

if (storageType === 'vercel-blob') {
  remotePatterns.push({
    protocol: 'https',
    hostname: '*.public.blob.vercel-storage.com',
  });
}

const nextConfig: NextConfig = {
  images: { remotePatterns },
};

export default nextConfig;
