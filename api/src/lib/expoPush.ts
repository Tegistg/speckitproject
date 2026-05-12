import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

const expo = new Expo();

export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.warn(`Invalid Expo push token: ${pushToken}`);
    return;
  }

  const message: ExpoPushMessage = { to: pushToken, sound: 'default', title, body, data };
  const chunks = expo.chunkPushNotifications([message]);

  for (const chunk of chunks) {
    try {
      const tickets: ExpoPushTicket[] = await expo.sendPushNotificationsAsync(chunk);
      for (const ticket of tickets) {
        if (ticket.status === 'error') {
          console.error('Push notification error:', ticket.message);
        }
      }
    } catch (err) {
      console.error('Failed to send push notification chunk:', err);
    }
  }
}

export async function sendPushToMany(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  const validMessages: ExpoPushMessage[] = tokens
    .filter(Expo.isExpoPushToken)
    .map((to) => ({ to, sound: 'default' as const, title, body, data }));

  if (validMessages.length === 0) return;

  const chunks = expo.chunkPushNotifications(validMessages);
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk).catch((err) =>
      console.error('Push batch error:', err),
    );
  }
}
