/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@helio/shared", "@helio/logger"],
};

module.exports = nextConfig;
