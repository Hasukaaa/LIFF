import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { ApiResponse, UpdateStatusRequest } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 認証チェック
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: '認証が必要です' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const body: UpdateStatusRequest = await request.json();
    const { status } = body;

    // ステータス値チェック
    const validStatuses = ['applied', 'accepted', 'waitlisted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: '不正なステータス値です' },
        { status: 400 }
      );
    }

    // ステータス更新
    const { error } = await supabaseAdmin
      .from('applicants')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'データベースエラーが発生しました' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'ステータスを更新しました' },
    });
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
