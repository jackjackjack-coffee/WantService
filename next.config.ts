import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // 워크스페이스 루트를 앱 디렉터리로 고정 — 상위 경로의 한글 디렉터리명이
  // Turbopack 모듈 식별자에 섞이면 char boundary 패닉이 발생한다.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
