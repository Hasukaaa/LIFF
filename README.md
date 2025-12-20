# LINE LIFF 出店応募システム

LINE LIFF を使った出店応募フォームと管理画面を備えたシステムです。

## 機能概要

- **応募フォーム（/apply）**: LINE LIFF 内で動作する10項目の応募フォーム
- **規約ページ（/terms）**: 応募規約の表示
- **管理画面（/admin）**: 応募者一覧・ステータス管理・合格通知送信・CSV エクスポート

## 技術スタック

- **フロントエンド**: Next.js 14（App Router）+ TypeScript + Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: Supabase（PostgreSQL）
- **認証**: LINE Login（ID Token 検証）
- **通知**: LINE Messaging API（Push メッセージ）

## セキュリティ対策

- ✅ サーバー側で ID Token を検証（クライアントからの userId は信用しない）
- ✅ Service Role Key と Channel Access Token はサーバーサイドのみで使用
- ✅ 管理画面は JWT 認証（httpOnly Cookie）
- ✅ 入力バリデーション

---

## セットアップ手順

### 1. Supabase プロジェクト作成

1. [Supabase](https://supabase.com/) にアクセスし、プロジェクトを作成
2. SQL Editor で `schema.sql` の内容を実行
3. Settings → API で以下の情報を取得：
   - `Project URL`（SUPABASE_URL）
   - `anon/public key`（SUPABASE_ANON_KEY）
   - `service_role key`（SUPABASE_SERVICE_ROLE_KEY）⚠️ 絶対に公開しない

### 2. LINE Developers 設定

#### 2-1. LINE Login チャネル作成（ID Token 検証用）

1. [LINE Developers Console](https://developers.line.biz/) にログイン
2. プロバイダーを作成（または既存のものを選択）
3. 「LINE Login」チャネルを新規作成
4. チャネル基本設定 → `Channel ID` をメモ（LINE_LOGIN_CHANNEL_ID）

#### 2-2. LIFF アプリ作成

1. 上記 LINE Login チャネルの「LIFF」タブを開く
2. 「追加」ボタンをクリック
3. 設定項目：
   - **LIFF アプリ名**: 出店応募フォーム（任意）
   - **サイズ**: Full
   - **エンドポイント URL**: `https://your-domain.vercel.app/apply`（デプロイ後のURL）
   - **Scope**: `openid` と `profile` を選択
   - **ボットリンク機能**: Off（任意）
4. 作成後、`LIFF ID` をメモ（NEXT_PUBLIC_LIFF_ID）

#### 2-3. Messaging API チャネル作成（Push 通知用）

1. プロバイダーで「Messaging API」チャネルを新規作成
2. チャネル基本設定 → Messaging API設定 → `Channel access token (long-lived)` を発行してメモ（LINE_CHANNEL_ACCESS_TOKEN）
3. ⚠️ このトークンは絶対に公開しない
4. 必要に応じて友だち追加用 QR コードを配布

### 3. 環境変数設定

`.env.example` をコピーして `.env.local` を作成し、以下を設定：

```bash
cp .env.example .env.local
```

`.env.local` を編集：

```env
# LIFF設定
NEXT_PUBLIC_LIFF_ID=1234567890-abcdefgh

# LINE Login設定（idToken検証用）
LINE_LOGIN_CHANNEL_ID=1234567890

# LINE Messaging API設定（Push通知用）
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here

# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# 管理画面認証
ADMIN_PASSWORD=your_secure_password_here
ADMIN_JWT_SECRET=your_jwt_secret_minimum_32_characters_here
```

### 4. ローカル開発

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで `http://localhost:3000` を開く

### 5. デプロイ（Vercel）

1. [Vercel](https://vercel.com/) にログイン
2. プロジェクトをインポート
3. Environment Variables に `.env.local` の内容を設定
4. デプロイ
5. デプロイ URL を取得したら、LINE Developers で LIFF のエンドポイント URL を更新

---

## ページ構成

- **/** - トップページ（フォーム・管理画面へのリンク）
- **/apply** - 出店応募フォーム（LIFF）
- **/terms** - 応募規約
- **/admin** - 管理画面（要パスワード認証）

## API エンドポイント

### 公開 API
- `POST /api/apply` - 応募フォーム送信

### 管理者 API
- `POST /api/admin/login` - 管理画面ログイン
- `POST /api/admin/logout` - 管理画面ログアウト
- `GET /api/admin/applicants` - 応募者一覧取得
- `PATCH /api/admin/applicants/[id]` - ステータス更新
- `POST /api/admin/push-accept` - 合格通知送信

---

## 使い方

### 応募者側

1. LINE 公式アカウントを友だち追加
2. LIFF URL（または QR コード）から応募フォームを開く
3. 10項目の必須情報を入力して送信
4. 受付番号が表示される
5. 選考結果は LINE メッセージで通知

### 管理者側

1. `/admin` にアクセス
2. 環境変数で設定したパスワードでログイン
3. 応募者一覧で検索・フィルタリング
4. ステータスを変更（応募済み → 合格/保留/不合格）
5. 合格者を選択して「合格通知を送信」
6. CSV エクスポートで応募データをダウンロード

---

## トラブルシューティング

### LIFF が初期化できない

- `NEXT_PUBLIC_LIFF_ID` が正しく設定されているか確認
- LIFF のエンドポイント URL がデプロイ先の URL と一致しているか確認
- ブラウザのコンソールでエラーを確認

### ID Token 検証が失敗する

- `LINE_LOGIN_CHANNEL_ID` が LIFF を作成したチャネルの ID と一致しているか確認
- LIFF の Scope に `openid` が含まれているか確認

### Push 通知が送信できない

- `LINE_CHANNEL_ACCESS_TOKEN` が正しいか確認
- Messaging API チャネルとユーザーが友だちになっているか確認
- ユーザーがブロックしていないか確認

### 管理画面にログインできない

- `ADMIN_PASSWORD` が正しいか確認
- Cookie が有効になっているか確認

---

## セキュリティ注意事項

⚠️ **絶対に公開してはいけない情報**：

- `SUPABASE_SERVICE_ROLE_KEY`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `ADMIN_PASSWORD`
- `ADMIN_JWT_SECRET`

これらは必ず環境変数で管理し、Git にコミットしないこと（`.gitignore` で `.env.local` を除外済み）

---

## ライセンス

MIT
