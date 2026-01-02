import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyIdToken, sendApplicationConfirmation } from '@/lib/line';
import { validateApplicationForm } from '@/lib/validation';
import { ApplyRequest, ApiResponse, ApplyResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: ApplyRequest = await request.json();
    const { idToken, formData, lineDisplayName } = body;

    // 1. idToken検証してuserId取得
    const userId = await verifyIdToken(idToken);
    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'IDトークンの検証に失敗しました' },
        { status: 401 }
      );
    }

    // 2. フォームバリデーション
    const validation = validateApplicationForm(formData);
    if (!validation.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // 3. DB保存
    const { data: applicant, error } = await supabaseAdmin
      .from('applicants')
      .insert({
        user_id: userId,
        line_display_name: lineDisplayName || null,
        stall_name: formData.stallName,
        representative_name: formData.representativeName,
        phone: formData.phone,
        base_area: formData.baseArea,
        started_ym: formData.startedYm,
        categories: formData.categories,
        description: formData.description,
        urls: formData.urls,
        power_needed: formData.powerNeeded,
        heat_source: formData.heatSource,
        agreed_at: new Date().toISOString(),
        status: 'applied',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'データベースエラーが発生しました' },
        { status: 500 }
      );
    }

    // 4. 応募確認メッセージを送信
    await sendApplicationConfirmation(userId, {
      stallName: formData.stallName,
      representativeName: formData.representativeName,
      phone: formData.phone,
      baseArea: formData.baseArea,
      startedYm: formData.startedYm,
      categories: formData.categories,
      description: formData.description,
      urls: formData.urls,
      powerNeeded: formData.powerNeeded,
      heatSource: formData.heatSource,
    });

    // 5. 成功レスポンス
    return NextResponse.json<ApiResponse<ApplyResponse>>({
      success: true,
      data: { applicationId: applicant.id },
    });
  } catch (error) {
    console.error('Apply API error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
