'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import liff from '@line/liff';
import { ApplicationFormData, BaseArea, Category, Applicant } from '@/types';

const BASE_AREAS: { value: BaseArea; label: string }[] = [
  { value: 'kagacity_resident', label: '加賀市民' },
  { value: 'kagacity_worker', label: '加賀市で働いている' },
  { value: 'kagacity_business', label: '加賀市で事業を営んでいる' },
  { value: 'other', label: 'その他' },
];

const CATEGORIES: Category[] = [
  '物販',
  '食品販売',
  '飲食提供',
  'WS',
  'ウェルネス施術',
  '占い',
  'その他',
];

export default function ApplyPage() {
  const [liffInitialized, setLiffInitialized] = useState(false);
  const [liffError, setLiffError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [existingApplication, setExistingApplication] = useState<Applicant | null>(null);
  const [isCheckingExisting, setIsCheckingExisting] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [friendshipChecked, setFriendshipChecked] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState<ApplicationFormData>({
    stallName: '',
    representativeName: '',
    phone: '',
    baseArea: 'kagacity_resident',
    startedYm: '',
    categories: [],
    description: '',
    urls: [''],
    powerNeeded: false,
    heatSource: false,
    agreed: false,
  });

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
          setLiffError('LIFF IDが設定されていません');
          return;
        }

        await liff.init({ liffId });
        if (!liff.isLoggedIn()) {
          liff.login();
        } else {
          setLiffInitialized(true);

          // 友だち登録状態をチェック
          try {
            const friendship = await liff.getFriendship();
            setIsFriend(friendship.friendFlag);
          } catch (error) {
            console.error('Friendship check failed:', error);
            // エラー時はチェックをスキップ（友だち登録必須化しない）
            setIsFriend(true);
          } finally {
            setFriendshipChecked(true);
          }

          // 既存の応募をチェック
          await checkExistingApplication();
        }
      } catch (error) {
        console.error('LIFF initialization failed:', error);
        setLiffError('LIFFの初期化に失敗しました');
      }
    };

    initLiff();
  }, []);

  // 既存応募チェック
  const checkExistingApplication = async () => {
    try {
      const idToken = liff.getIDToken();
      if (!idToken) {
        setIsCheckingExisting(false);
        return;
      }

      const response = await fetch('/api/my-application', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const result = await response.json();

      if (result.success && result.data) {
        setExistingApplication(result.data);
      }
    } catch (error) {
      console.error('Check existing application error:', error);
    } finally {
      setIsCheckingExisting(false);
    }
  };

  // 辞退処理
  const handleWithdraw = async () => {
    if (!existingApplication) return;

    if (!confirm('本当に辞退しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/admin/applicants/${existingApplication.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });

      const result = await response.json();

      if (result.success) {
        alert('辞退しました');
        // 再チェック
        await checkExistingApplication();
      } else {
        alert('辞退に失敗しました');
      }
    } catch (error) {
      console.error('Withdraw error:', error);
      alert('辞退中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 編集モードに入る
  const handleStartEdit = () => {
    if (!existingApplication) return;

    // 既存データをフォームに読み込む
    setFormData({
      stallName: existingApplication.stall_name,
      representativeName: existingApplication.representative_name,
      phone: existingApplication.phone,
      baseArea: existingApplication.base_area,
      startedYm: existingApplication.started_ym,
      categories: existingApplication.categories as Category[],
      description: existingApplication.description,
      urls: existingApplication.urls.length > 0 ? existingApplication.urls : [''],
      powerNeeded: existingApplication.power_needed,
      heatSource: existingApplication.heat_source,
      agreed: true, // 既に同意済み
    });

    setIsEditMode(true);
  };

  // 編集キャンセル
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setErrors([]);
  };

  const handleCategoryChange = (category: Category, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        categories: [...prev.categories, category],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c !== category),
      }));
    }
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...formData.urls];
    newUrls[index] = value;
    setFormData((prev) => ({ ...prev, urls: newUrls }));
  };

  const addUrlField = () => {
    setFormData((prev) => ({ ...prev, urls: [...prev.urls, ''] }));
  };

  const removeUrlField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      urls: prev.urls.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsSubmitting(true);

    try {
      // IDトークン取得
      const idToken = liff.getIDToken();
      if (!idToken) {
        setErrors(['認証に失敗しました。もう一度お試しください。']);
        setIsSubmitting(false);
        return;
      }

      // URLフィルタ（空文字除去）
      const filteredUrls = formData.urls.filter((url) => url.trim() !== '');
      const submitData = { ...formData, urls: filteredUrls };

      let response;

      if (isEditMode) {
        // 編集モード：既存データを更新
        response = await fetch('/api/my-application', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            formData: submitData,
          }),
        });
      } else {
        // 新規応募モード
        response = await fetch('/api/apply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idToken,
            formData: submitData,
          }),
        });
      }

      const result = await response.json();

      if (result.success) {
        if (isEditMode) {
          // 編集完了：応募一覧に戻る
          alert('応募内容を更新しました');
          setIsEditMode(false);
          await checkExistingApplication();
        } else {
          // 新規応募完了
          setApplicationId(result.data.applicationId);
          setSubmitted(true);
        }
      } else {
        setErrors([result.error || '送信に失敗しました']);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setErrors(['送信中にエラーが発生しました']);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (liffError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800">{liffError}</p>
        </div>
      </div>
    );
  }

  if (!liffInitialized || !friendshipChecked || isCheckingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  // 友だち登録していない場合
  if (!isFriend) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <div className="text-yellow-600 text-5xl mb-4">!</div>
          <h1 className="text-2xl font-bold mb-4">友だち追加が必要です</h1>
          <p className="text-gray-600 mb-6">
            応募するには、LINE公式アカウントを友だち追加する必要があります。
          </p>
          <p className="text-sm text-gray-500 mb-6">
            友だち追加後、もう一度このページを開いてください。
          </p>
          <button
            onClick={() => {
              // LINEアプリを閉じる
              liff.closeWindow();
            }}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            閉じる
          </button>
        </div>
      </div>
    );
  }

  // 既に応募済みの場合（編集モードでない場合）
  if (existingApplication && !isEditMode) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">応募内容</h1>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              応募済みです。内容の編集や辞退は下のボタンから行えます。
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">応募ID</label>
              <p className="font-mono text-sm">{existingApplication.id}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">屋号/出店名</label>
              <p className="font-medium">{existingApplication.stall_name}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">代表者氏名</label>
              <p>{existingApplication.representative_name}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">電話番号</label>
              <p>{existingApplication.phone}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">出店カテゴリ</label>
              <p>{existingApplication.categories.join('、')}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">出店内容</label>
              <p className="whitespace-pre-wrap bg-gray-50 p-3 rounded">
                {existingApplication.description}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">ステータス</label>
              <p className="mt-1">
                {existingApplication.status === 'applied' && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    応募済み（選考中）
                  </span>
                )}
                {existingApplication.status === 'accepted' && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                    合格
                  </span>
                )}
                {existingApplication.status === 'waitlisted' && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                    保留
                  </span>
                )}
                {existingApplication.status === 'rejected' && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm">
                    不合格/辞退済み
                  </span>
                )}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">応募日時</label>
              <p className="text-sm">{new Date(existingApplication.created_at).toLocaleString('ja-JP')}</p>
            </div>
          </div>

          {existingApplication.status !== 'rejected' && (
            <div className="mt-8 pt-6 border-t space-y-3">
              <button
                onClick={handleStartEdit}
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                応募内容を編集
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isSubmitting}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '処理中...' : '辞退する'}
              </button>
              <p className="text-xs text-gray-500 text-center">
                ※辞退すると再応募はできません
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold mb-4">応募を受け付けました</h1>
          <p className="text-gray-700 mb-4">
            ご応募ありがとうございます。
          </p>
          <p className="text-sm text-gray-600 mb-6">
            選考結果はLINEメッセージにてご連絡いたします。
            <br />
            しばらくお待ちください。
          </p>
          <button
            onClick={() => {
              liff.closeWindow();
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            閉じる
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">
          {isEditMode ? '応募内容の編集' : '出店応募フォーム'}
        </h1>

        {isEditMode && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              応募内容を編集できます。変更を保存する場合は下の「更新する」ボタンを押してください。
            </p>
          </div>
        )}

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <ul className="text-red-800 text-sm space-y-1">
              {errors.map((error, i) => (
                <li key={i}>・{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. 屋号/出店名 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              屋号/出店名 <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.stallName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, stallName: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* 2. 代表者氏名 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              代表者氏名 <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.representativeName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  representativeName: e.target.value,
                }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* 3. 電話番号 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              電話番号 <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="090-1234-5678"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* 4. 活動拠点 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              活動拠点 <span className="text-red-600">*</span>
            </label>
            <select
              required
              value={formData.baseArea}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  baseArea: e.target.value as BaseArea,
                }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {BASE_AREAS.map((area) => (
                <option key={area.value} value={area.value}>
                  {area.label}
                </option>
              ))}
            </select>
          </div>

          {/* 5. 事業開始時期 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              事業開始時期 <span className="text-red-600">*</span>
            </label>
            <input
              type="month"
              required
              value={formData.startedYm}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, startedYm: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">YYYY-MM形式で入力</p>
          </div>

          {/* 6. 出店カテゴリ */}
          <div>
            <label className="block text-sm font-medium mb-2">
              出店カテゴリ（複数選択可） <span className="text-red-600">*</span>
            </label>
            <div className="space-y-2">
              {CATEGORIES.map((category) => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category)}
                    onChange={(e) =>
                      handleCategoryChange(category, e.target.checked)
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 7. 出店内容 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              出店内容 <span className="text-red-600">*</span>
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={4}
              placeholder="販売する商品やサービスの内容、価格帯などを具体的にご記入ください"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* 8. HP/SNS URL */}
          <div>
            <label className="block text-sm font-medium mb-1">
              HP/SNS URL <span className="text-red-600">*</span>
            </label>
            {formData.urls.map((url, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="url"
                  required={index === 0}
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  placeholder="https://..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                />
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removeUrlField(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    削除
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addUrlField}
              className="text-sm text-blue-600 hover:underline"
            >
              + URLを追加
            </button>
          </div>

          {/* 9. 会場条件 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              会場条件 <span className="text-red-600">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.powerNeeded}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      powerNeeded: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                <span className="text-sm">電源が必要</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.heatSource}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      heatSource: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                <span className="text-sm">火気・熱源を使用する</span>
              </label>
            </div>
          </div>

          {/* 10. 規約同意 */}
          <div>
            <label className="flex items-start">
              <input
                type="checkbox"
                required
                checked={formData.agreed}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, agreed: e.target.checked }))
                }
                className="mr-2 mt-1"
              />
              <span className="text-sm">
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  応募規約
                </Link>
                に同意する <span className="text-red-600">*</span>
              </span>
            </label>
          </div>

          {/* 送信ボタン */}
          <div className="pt-4">
            {isEditMode ? (
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '更新中...' : '更新する'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className="w-full bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  キャンセル
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '送信中...' : '応募する'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
