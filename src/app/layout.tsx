// src/app/layout.tsx
'use client';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import React from "react";
import Head from 'next/head';
import ClientHeader from "./components/ClientHeader";
import useAuth from "./useAuth";

const inter = Inter({ subsets: ["latin"] });

const metadata: Metadata = {
  title: "Snap Stream",
  description: "動画共有アプリのホームページです",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useAuth(); // 認証チェックを追加

  return (
    <html lang="ja">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{metadata.title?.toString() ?? "SnapStream アプリ"}</title>
        <meta name="description" content={metadata.description ?? ""} />
      </Head>
      <body className={inter.className}>
        <ClientHeader />
        {children}
      </body>
    </html>
  );
}
