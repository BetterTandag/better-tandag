import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cache Components: nothing is cached implicitly. Opt in per function with
  // the 'use cache' directive plus cacheLife/cacheTag.
  cacheComponents: true,
};

export default nextConfig;
