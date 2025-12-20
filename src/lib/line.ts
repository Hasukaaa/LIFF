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
