import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Controls how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('float-requests', {
      name: 'Float Requests',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D32F2F',
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

const fmt = (n) => `TZS ${Number(n).toLocaleString()}`;

const STATUS_COPY = {
  approved: (r) => ({
    title: 'Request Approved ✓',
    body: `${fmt(r.amount)} • ${r.sourceNetwork} → ${r.destNetwork} has been approved.`,
  }),
  completed: (r) => ({
    title: 'Transfer Completed ✓',
    body: `${fmt(r.amount)} • ${r.sourceNetwork} → ${r.destNetwork} has been processed.`,
  }),
  rejected: (r) => ({
    title: 'Request Rejected',
    body: `Your float request for ${fmt(r.amount)} was rejected. Tap to view details.`,
  }),
};

export async function scheduleStatusNotification(request) {
  const builder = STATUS_COPY[request.status];
  if (!builder) return;
  const { title, body } = builder(request);

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { requestId: request.id, status: request.status },
      sound: true,
    },
    trigger: null, // fire immediately
  });
}
