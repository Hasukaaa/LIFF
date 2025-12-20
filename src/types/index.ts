// 活動拠点
export type BaseArea = 'kagacity_resident' | 'kagacity_worker' | 'kagacity_business' | 'other';

// 出店カテゴリ
export type Category = '物販' | '食品販売' | '飲食提供' | 'WS' | 'ウェルネス施術' | '占い' | 'その他';

// ステータス
export type ApplicationStatus = 'applied' | 'accepted' | 'waitlisted' | 'rejected';

// 応募フォームデータ
export interface ApplicationFormData {
  stallName: string;
  representativeName: string;
  phone: string;
  baseArea: BaseArea;
  startedYm: string; // YYYY-MM
  categories: Category[];
  description: string;
  urls: string[];
  powerNeeded: boolean;
  heatSource: boolean;
  agreed: boolean;
}

// DB保存用応募データ
export interface Applicant {
  id: string;
  user_id: string;
  stall_name: string;
  representative_name: string;
  phone: string;
  base_area: BaseArea;
  started_ym: string;
  categories: string[];
  description: string;
  urls: string[];
  power_needed: boolean;
  heat_source: boolean;
  agreed_at: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

// APIレスポンス
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// 応募APIリクエスト
export interface ApplyRequest {
  idToken: string;
  formData: ApplicationFormData;
}

// 応募APIレスポンス
export interface ApplyResponse {
  applicationId: string;
}

// ステータス更新リクエスト
export interface UpdateStatusRequest {
  status: ApplicationStatus;
}

// Push通知リクエスト
export interface PushAcceptRequest {
  applicantIds: string[];
}
