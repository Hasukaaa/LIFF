import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { sendPushMessage } from '@/lib/line';
import { ApiResponse, PushAcceptRequest } from '@/types';

const ACCEPT_MESSAGE = `【出店のご案内】
このたびはご応募ありがとうございます。

選考の結果、出店をお願いしたくご連絡しました。

詳細（搬入・当日の案内・出店料等）を追ってご案内します。
まずは本メッセージに一言ご返信ください。`;

export async function POST(request: NextRequest) {
  // 認証チェック
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: '認証が必要です' },
      { status: 401 }
    );
  }

  try {
    const body: PushAcceptRequest = await request.json();
    const { applicantIds } = body;

    if (!applicantIds || applicantIds.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: '送信対象が選択されていません' },
        { status: 400 }
      );
    }

    // 対象の応募者情報を取得
    const { data: applicants, error: fetchError } = await supabaseAdmin
      .from('applicants')
      .select('id, user_id, stall_name')
      .in('id', applicantIds);

    if (fetchError || !applicants) {
      console.error('Database error:', fetchError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'データベースエラーが発生しました' },
        { status: 500 }
      );
    }

    // Push通知送信
    const results = await Promise.allSettled(
      applicants.map(async (applicant) => {
        const success = await sendPushMessage(applicant.user_id, ACCEPT_MESSAGE);
        if (success) {
          // ステータスをacceptedに更新
          await supabaseAdmin
            .from('applicants')
            .update({ status: 'accepted' })
            .eq('id', applicant.id);
        }
        return { id: applicant.id, success };
      })
    );

    // 結果集計
    const successCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;
    const failCount = results.length - successCount;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        message: `${successCount}件の通知を送信しました${failCount > 0 ? `（${failCount}件失敗）` : ''}`,
        successCount,
        failCount,
      },
    });
  } catch (error) {
    console.error('Push accept error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
