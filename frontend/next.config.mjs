/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      "/email-triage": ["./public/email-triage/index.html"],
    },
  },
};
export default nextConfig;
