/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/',
                destination: '/app',
            },
        ]
    },
};

export default nextConfig;
