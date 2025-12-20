import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '出店応募フォーム',
  description: 'LINE LIFF出店応募システム',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
