import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-8">出店応募システム</h1>
      <div className="space-y-4">
        <Link
          href="/apply"
          className="block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
        >
          出店応募フォーム
        </Link>
        <Link
          href="/admin"
          className="block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-center"
        >
          管理画面
        </Link>
      </div>
    </div>
  );
}
