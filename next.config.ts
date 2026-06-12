import type { NextConfig } from 'next';

const storageType = process.env.STORAGE_TYPE ?? 'minio';
// @ts-ignore: remotePatterns exists at runtime
const remotePatterns: NextConfig['images']['remotePatterns'] = [];

if (storageType === 'minio') {
  const useSsl = process.env.MINIO_USE_SSL === 'true';
  // Use the browser-facing host. MINIO_ENDPOINT is the container service
  // hostname (e.g. "minio") and is not reachable from the browser.
  const hostname = process.env.MINIO_PUBLIC_HOST ?? 'localhost';
  const port =
    process.env.MINIO_PUBLIC_PORT ?? process.env.MINIO_PORT ?? '9000';
  remotePatterns.push({
    protocol: useSsl ? 'https' : 'http',
    hostname,
    port,
  });
}

if (storageType === 'vercel-blob') {
  remotePatterns.push({
    protocol: 'https',
    hostname: '*.public.blob.vercel-storage.com',
  });
}

remotePatterns.push({
  protocol: 'https',
  hostname: 'api.dicebear.com',
});

remotePatterns.push({
  protocol: 'https',
  hostname: 'images.unsplash.com',
});

const nextConfig: NextConfig = {
  images: { remotePatterns },
};

export default nextConfig;
