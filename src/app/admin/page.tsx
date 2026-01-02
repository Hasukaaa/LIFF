'use client';

import { useState, useEffect } from 'react';
import { Applicant, ApplicationStatus } from '@/types';

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: '応募済み',
  accepted: '合格',
  waitlisted: '保留',
  rejected: '不合格',
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  waitlisted: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [filteredApplicants, setFilteredApplicants] = useState<Applicant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ログイン処理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (result.success) {
        setIsLoggedIn(true);
        loadApplicants();
      } else {
        setLoginError(result.error || 'ログインに失敗しました');
      }
    } catch (error) {
      setLoginError('ログイン中にエラーが発生しました');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ログアウト処理
  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsLoggedIn(false);
    setPassword('');
  };

  // 応募者一覧取得
  const loadApplicants = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/admin/applicants?${params}`);
      const result = await response.json();

      if (result.success) {
        setApplicants(result.data);
        setFilteredApplicants(result.data);
      }
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // フィルタリング
  useEffect(() => {
    let filtered = applicants;

    if (searchTerm) {
      filtered = filtered.filter(
        (a) =>
          a.stall_name.includes(searchTerm) ||
          a.representative_name.includes(searchTerm)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    setFilteredApplicants(filtered);
  }, [searchTerm, statusFilter, applicants]);

  // ステータス更新
  const updateStatus = async (id: string, status: ApplicationStatus) => {
    try {
      const response = await fetch(`/api/admin/applicants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage('ステータスを更新しました');
        loadApplicants();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  // 合格通知送信
  const sendAcceptNotification = async () => {
    if (selectedIds.size === 0) {
      alert('送信対象を選択してください');
      return;
    }

    if (!confirm(`${selectedIds.size}件の合格通知を送信しますか？`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/push-accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantIds: Array.from(selectedIds) }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(result.data.message);
        setSelectedIds(new Set());
        loadApplicants();
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      console.error('Push error:', error);
    }
  };

  // CSV エクスポート
  const exportCSV = () => {
    const headers = [
      'ID',
      'LINE User ID',
      '屋号',
      '代表者名',
      '電話',
      '活動拠点',
      '事業開始',
      'カテゴリ',
      '出店内容',
      'URL',
      '電源',
      '火気',
      'ステータス',
      '応募日時',
    ];

    const rows = filteredApplicants.map((a) => [
      a.id,
      a.user_id,
      a.stall_name,
      a.representative_name,
      a.phone,
      a.base_area,
      a.started_ym,
      a.categories.join('・'),
      a.description.replace(/\n/g, ' '),
      a.urls.join(' '),
      a.power_needed ? 'あり' : 'なし',
      a.heat_source ? 'あり' : 'なし',
      STATUS_LABELS[a.status],
      new Date(a.created_at).toLocaleString('ja-JP'),
    ]);

    const csv =
      [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `applicants_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // チェックボックス操作
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredApplicants.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApplicants.map((a) => a.id)));
    }
  };

  // ログイン前
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">管理画面ログイン</h1>

          {loginError && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-red-800 text-sm">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoggingIn ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 管理画面本体
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">応募者管理画面</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ログアウト
          </button>
        </div>

        {/* メッセージ */}
        {message && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-green-800">
            {message}
          </div>
        )}

        {/* 検索・フィルタ */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">検索</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="屋号または氏名"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">ステータス</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | '')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">すべて</option>
                <option value="applied">応募済み</option>
                <option value="accepted">合格</option>
                <option value="waitlisted">保留</option>
                <option value="rejected">不合格</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={loadApplicants}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                再読込
              </button>
              <button
                onClick={exportCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                CSV出力
              </button>
            </div>
          </div>
        </div>

        {/* アクション */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {selectedIds.size}件選択中
            </span>
            <button
              onClick={sendAcceptNotification}
              disabled={selectedIds.size === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              合格通知を送信
            </button>
          </div>
        </div>

        {/* 応募者一覧 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-600">読み込み中...</div>
          ) : filteredApplicants.length === 0 ? (
            <div className="p-8 text-center text-gray-600">応募者がいません</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredApplicants.length}
                        onChange={toggleAll}
                      />
                    </th>
                    <th className="p-3 text-left">屋号</th>
                    <th className="p-3 text-left">代表者名</th>
                    <th className="p-3 text-left">LINE User ID</th>
                    <th className="p-3 text-left">電話</th>
                    <th className="p-3 text-left">カテゴリ</th>
                    <th className="p-3 text-left">応募日時</th>
                    <th className="p-3 text-left">ステータス</th>
                    <th className="p-3 text-left">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredApplicants.map((applicant) => (
                    <tr key={applicant.id} className="hover:bg-gray-50">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(applicant.id)}
                          onChange={() => toggleSelection(applicant.id)}
                        />
                      </td>
                      <td
                        className="p-3 cursor-pointer text-blue-600 hover:underline"
                        onClick={() => {
                          setSelectedApplicant(applicant);
                          setShowDetailModal(true);
                        }}
                      >
                        {applicant.stall_name}
                      </td>
                      <td className="p-3">{applicant.representative_name}</td>
                      <td className="p-3 text-xs font-mono">{applicant.user_id}</td>
                      <td className="p-3 text-sm">{applicant.phone}</td>
                      <td className="p-3 text-xs">
                        {applicant.categories.join('・')}
                      </td>
                      <td className="p-3 text-sm">
                        {new Date(applicant.created_at).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            STATUS_COLORS[applicant.status]
                          }`}
                        >
                          {STATUS_LABELS[applicant.status]}
                        </span>
                      </td>
                      <td className="p-3">
                        <select
                          value={applicant.status}
                          onChange={(e) =>
                            updateStatus(applicant.id, e.target.value as ApplicationStatus)
                          }
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="applied">応募済み</option>
                          <option value="accepted">合格</option>
                          <option value="waitlisted">保留</option>
                          <option value="rejected">不合格</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          全{filteredApplicants.length}件
        </div>

        {/* 詳細モーダル */}
        {showDetailModal && selectedApplicant && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">応募詳細</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">応募ID</label>
                      <p className="text-sm font-mono">{selectedApplicant.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">LINE User ID</label>
                      <p className="text-sm font-mono break-all">{selectedApplicant.user_id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">屋号/出店名</label>
                      <p className="font-medium">{selectedApplicant.stall_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">代表者氏名</label>
                      <p className="font-medium">{selectedApplicant.representative_name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">電話番号</label>
                      <p>{selectedApplicant.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">活動拠点</label>
                      <p>{selectedApplicant.base_area}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">事業開始時期</label>
                      <p>{selectedApplicant.started_ym}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">ステータス</label>
                      <span
                        className={`inline-block px-3 py-1 rounded text-sm ${
                          STATUS_COLORS[selectedApplicant.status]
                        }`}
                      >
                        {STATUS_LABELS[selectedApplicant.status]}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">出店カテゴリ</label>
                    <p>{selectedApplicant.categories.join('、')}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">出店内容</label>
                    <p className="whitespace-pre-wrap bg-gray-50 p-3 rounded">
                      {selectedApplicant.description}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">HP/SNS URL</label>
                    <div className="space-y-1">
                      {selectedApplicant.urls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-blue-600 hover:underline break-all"
                        >
                          {url}
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">電源</label>
                      <p>{selectedApplicant.power_needed ? '必要' : '不要'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">火気・熱源</label>
                      <p>{selectedApplicant.heat_source ? '使用する' : '使用しない'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">応募日時</label>
                      <p className="text-sm">
                        {new Date(selectedApplicant.created_at).toLocaleString('ja-JP')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">規約同意日時</label>
                      <p className="text-sm">
                        {new Date(selectedApplicant.agreed_at).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
