import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { sendPushMessage } from '@/lib/line';
import { ApiResponse, PushAcceptRequest } from '@/types';

const REJECT_MESSAGE = `【選考結果のお知らせ】
このたびはご応募いただきありがとうございました。

誠に残念ながら、今回は出店をお願いすることができない結果となりました。

多数のご応募をいただいたため、やむを得ずこのような結果となりましたことをご理解いただけますと幸いです。

また機会がございましたら、ぜひご応募をお待ちしております。`;

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
        const success = await sendPushMessage(applicant.user_id, REJECT_MESSAGE);
        if (success) {
          // ステータスをrejectedに更新
          await supabaseAdmin
            .from('applicants')
            .update({ status: 'rejected' })
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
    console.error('Push reject error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
