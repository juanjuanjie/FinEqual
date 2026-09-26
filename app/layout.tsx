import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og.png`;
  const title = "金融信息平权｜免费金融信息 API 聚合平台";
  const description = "让金融信息不再有门槛。为中文开发者聚合免费的金融信息 API，提供字段说明、代码示例与 OpenAPI 规范。";
  return {
    title,
    description,
    openGraph: { title, description, type: "website", images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN">
    <head>
      <link rel="icon" href="/finequal-favicon-v7.svg" type="image/svg+xml" />
      <link rel="shortcut icon" href="/finequal-favicon-v7.svg" />
      <link rel="apple-touch-icon" href="/logo.png?v=7" />
    </head>
    <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
  </html>;
}
