import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth';
import { ApiResponse } from '@/types';

export async function POST() {
  const response = NextResponse.json<ApiResponse>({
    success: true,
    data: { message: 'ログアウトしました' },
  });

  // Cookie削除
  response.cookies.delete(COOKIE_NAME);

  return response;
}
