import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { ApiResponse, Applicant } from '@/types';

export async function GET(request: NextRequest) {
  // 認証チェック
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: '認証が必要です' },
      { status: 401 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // クエリビルド
    let query = supabaseAdmin
      .from('applicants')
      .select('*')
      .order('created_at', { ascending: false });

    // 検索フィルタ（屋号または代表者名）
    if (search) {
      query = query.or(`stall_name.ilike.%${search}%,representative_name.ilike.%${search}%`);
    }

    // ステータスフィルタ
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'データベースエラーが発生しました' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Applicant[]>>({
      success: true,
      data: data as Applicant[],
    });
  } catch (error) {
    console.error('Get applicants error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
