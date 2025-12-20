-- 出店応募者テーブル
CREATE TABLE IF NOT EXISTS applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  stall_name TEXT NOT NULL,
  representative_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  base_area TEXT NOT NULL CHECK (base_area IN ('kagacity_resident', 'kagacity_worker', 'kagacity_business', 'other')),
  started_ym TEXT NOT NULL,
  categories TEXT[] NOT NULL,
  description TEXT NOT NULL,
  urls TEXT[] NOT NULL,
  power_needed BOOLEAN NOT NULL,
  heat_source BOOLEAN NOT NULL,
  agreed_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'accepted', 'waitlisted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_applicants_user_id ON applicants(user_id);
CREATE INDEX IF NOT EXISTS idx_applicants_status ON applicants(status);
CREATE INDEX IF NOT EXISTS idx_applicants_created_at ON applicants(created_at DESC);

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_applicants_updated_at BEFORE UPDATE
    ON applicants FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 有効化
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

-- サービスロールキーでの全アクセス許可ポリシー（管理画面用）
CREATE POLICY "Enable all access for service role" ON applicants
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 匿名ユーザー向けポリシー（応募フォームから挿入のみ許可）
CREATE POLICY "Enable insert for authenticated users" ON applicants
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE applicants IS '出店応募者情報';
COMMENT ON COLUMN applicants.id IS '応募ID';
COMMENT ON COLUMN applicants.user_id IS 'LINE User ID';
COMMENT ON COLUMN applicants.stall_name IS '屋号/出店名';
COMMENT ON COLUMN applicants.representative_name IS '代表者氏名';
COMMENT ON COLUMN applicants.phone IS '電話番号';
COMMENT ON COLUMN applicants.base_area IS '活動拠点';
COMMENT ON COLUMN applicants.started_ym IS '事業開始時期（YYYY-MM形式）';
COMMENT ON COLUMN applicants.categories IS '出店カテゴリ（複数選択可）';
COMMENT ON COLUMN applicants.description IS '出店内容';
COMMENT ON COLUMN applicants.urls IS 'HP/SNS URL（複数可）';
COMMENT ON COLUMN applicants.power_needed IS '電源必要';
COMMENT ON COLUMN applicants.heat_source IS '火気・熱源使用';
COMMENT ON COLUMN applicants.agreed_at IS '規約同意日時';
COMMENT ON COLUMN applicants.status IS 'ステータス（applied/accepted/waitlisted/rejected）';
