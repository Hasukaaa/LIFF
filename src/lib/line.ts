// LINE IDトークン検証
export async function verifyIdToken(idToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        id_token: idToken,
        client_id: process.env.LINE_LOGIN_CHANNEL_ID!,
      }),
    });

    if (!response.ok) {
      console.error('ID token verification failed:', await response.text());
      return null;
    }

    const data = await response.json();

    // subがLINE User ID
    return data.sub || null;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return null;
  }
}

// LINE Push通知送信
export async function sendPushMessage(userId: string, message: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [
          {
            type: 'text',
            text: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('Push message failed:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending push message:', error);
    return false;
  }
}

// 応募確認メッセージを送信
export async function sendApplicationConfirmation(
  userId: string,
  applicationData: {
    stallName: string;
    representativeName: string;
    phone: string;
    baseArea: string;
    startedYm: string;
    categories: string[];
    description: string;
    urls: string[];
    powerNeeded: boolean;
    heatSource: boolean;
  }
): Promise<boolean> {
  const baseAreaLabels: Record<string, string> = {
    kagacity_resident: '加賀市民',
    kagacity_worker: '加賀市で働いている',
    kagacity_business: '加賀市で事業を営んでいる',
    other: 'その他',
  };

  const message = `【応募を受け付けました】

ご応募ありがとうございます。
以下の内容で受け付けました。

▼ 応募内容
屋号: ${applicationData.stallName}
代表者: ${applicationData.representativeName}
電話: ${applicationData.phone}
拠点: ${baseAreaLabels[applicationData.baseArea] || applicationData.baseArea}
カテゴリ: ${applicationData.categories.join('、')}

━━━━━━━━━━

【応募内容の確認・編集】
下記リンクから確認・編集できます
https://liff-seven.vercel.app/apply

【辞退について】
辞退される場合は、このLINEに直接メッセージをお送りください。

選考結果は追ってご連絡いたします。`;

  return sendPushMessage(userId, message);
}
