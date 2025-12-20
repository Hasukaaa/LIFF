import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword, createAdminToken, COOKIE_NAME } from '@/lib/auth';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // パスワード検証
    const isValid = await verifyAdminPassword(password);
    if (!isValid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'パスワードが正しくありません' },
        { status: 401 }
      );
    }

    // JWT トークン生成
    const token = await createAdminToken();

    // レスポンスとCookie設定
    const response = NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'ログインしました' },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24時間
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
