import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyIdToken } from '@/lib/line';
import { ApiResponse, Applicant } from '@/types';

// 自分の応募情報を取得
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7);

    // idToken検証してuserId取得
    const userId = await verifyIdToken(idToken);
    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'IDトークンの検証に失敗しました' },
        { status: 401 }
      );
    }

    // 既存の応募を取得（最新のもの）
    const { data, error } = await supabaseAdmin
      .from('applicants')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = データが見つからない（エラーではない）
      console.error('Database error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'データベースエラーが発生しました' },
        { status: 500 }
      );
    }

    if (!data) {
      // 応募データなし
      return NextResponse.json<ApiResponse>({
        success: true,
        data: null,
      });
    }

    return NextResponse.json<ApiResponse<Applicant>>({
      success: true,
      data: data as Applicant,
    });
  } catch (error) {
    console.error('Get my application error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
