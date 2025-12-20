import { ApplicationFormData, BaseArea, Category } from '@/types';

const BASE_AREAS: BaseArea[] = ['kagacity_resident', 'kagacity_worker', 'kagacity_business', 'other'];
const CATEGORIES: Category[] = ['物販', '食品販売', '飲食提供', 'WS', 'ウェルネス施術', '占い', 'その他'];

// YYYY-MM形式チェック
export function isValidYearMonth(ym: string): boolean {
  const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
  return regex.test(ym);
}

// 電話番号形式チェック（簡易版）
export function isValidPhone(phone: string): boolean {
  const regex = /^[0-9-]+$/;
  return regex.test(phone) && phone.length >= 10;
}

// URL形式チェック
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// フォームデータ検証
export function validateApplicationForm(data: ApplicationFormData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 必須項目チェック
  if (!data.stallName?.trim()) errors.push('屋号/出店名は必須です');
  if (!data.representativeName?.trim()) errors.push('代表者氏名は必須です');
  if (!data.phone?.trim()) errors.push('電話番号は必須です');
  if (!data.baseArea) errors.push('活動拠点は必須です');
  if (!data.startedYm) errors.push('事業開始時期は必須です');
  if (!data.categories || data.categories.length === 0) errors.push('出店カテゴリは1つ以上選択してください');
  if (!data.description?.trim()) errors.push('出店内容は必須です');
  if (!data.urls || data.urls.length === 0) errors.push('HP/SNS URLは1つ以上入力してください');
  if (!data.agreed) errors.push('規約への同意が必要です');

  // 形式チェック
  if (data.phone && !isValidPhone(data.phone)) {
    errors.push('電話番号の形式が不正です');
  }

  if (data.startedYm && !isValidYearMonth(data.startedYm)) {
    errors.push('事業開始時期はYYYY-MM形式で入力してください');
  }

  if (data.baseArea && !BASE_AREAS.includes(data.baseArea)) {
    errors.push('活動拠点の値が不正です');
  }

  if (data.categories) {
    const invalidCategories = data.categories.filter(c => !CATEGORIES.includes(c));
    if (invalidCategories.length > 0) {
      errors.push('出店カテゴリに不正な値が含まれています');
    }
  }

  if (data.urls) {
    const invalidUrls = data.urls.filter(url => !isValidUrl(url));
    if (invalidUrls.length > 0) {
      errors.push('URLの形式が不正です: ' + invalidUrls.join(', '));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
