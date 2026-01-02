import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyIdToken } from '@/lib/line';
import { ApiResponse, Applicant, ApplicationFormData } from '@/types';

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

// 自分の応募情報を更新
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { formData } = body as { formData: ApplicationFormData };

    // バリデーション
    const errors: string[] = [];

    if (!formData.stallName?.trim()) {
      errors.push('屋号/出店名を入力してください');
    }
    if (!formData.representativeName?.trim()) {
      errors.push('代表者氏名を入力してください');
    }
    if (!formData.phone?.trim()) {
      errors.push('電話番号を入力してください');
    }
    if (!formData.startedYm?.trim()) {
      errors.push('事業開始時期を入力してください');
    }
    if (!formData.categories || formData.categories.length === 0) {
      errors.push('出店カテゴリを選択してください');
    }
    if (!formData.description?.trim()) {
      errors.push('出店内容を入力してください');
    }
    if (!formData.urls || formData.urls.filter((u) => u.trim()).length === 0) {
      errors.push('HP/SNS URLを入力してください');
    }

    if (errors.length > 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: errors.join('、') },
        { status: 400 }
      );
    }

    // 既存の応募を取得（編集可能かチェック）
    const { data: existingData, error: fetchError } = await supabaseAdmin
      .from('applicants')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: '応募情報が見つかりません' },
        { status: 404 }
      );
    }

    // 辞退済み（rejected）の場合は編集不可
    if (existingData.status === 'rejected') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: '辞退済みの応募は編集できません' },
        { status: 403 }
      );
    }

    // 更新データ作成
    const updateData = {
      stall_name: formData.stallName.trim(),
      representative_name: formData.representativeName.trim(),
      phone: formData.phone.trim(),
      base_area: formData.baseArea,
      started_ym: formData.startedYm,
      categories: formData.categories,
      description: formData.description.trim(),
      urls: formData.urls.filter((url) => url.trim() !== ''),
      power_needed: formData.powerNeeded,
      heat_source: formData.heatSource,
    };

    // DB更新
    const { data, error } = await supabaseAdmin
      .from('applicants')
      .update(updateData)
      .eq('id', existingData.id)
      .select()
      .single();

    if (error) {
      console.error('Update application error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'データベースエラーが発生しました' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Applicant>>({
      success: true,
      data: data as Applicant,
    });
  } catch (error) {
    console.error('Update my application error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
