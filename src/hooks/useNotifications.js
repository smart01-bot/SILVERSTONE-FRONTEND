import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { listenRequests } from '../utils/firestore';
import { requestPermissions, scheduleStatusNotification } from '../config/notifications';
import { navigationRef } from '../navigation/AppNavigator';

const NOTIFIABLE = new Set(['approved', 'completed', 'rejected']);

export function useNotifications(userId) {
  const prevMap     = useRef({}); // requestId → last known status
  const initialized = useRef(false);

  // Ask for permission once when the user first lands in the app
  useEffect(() => {
    requestPermissions();
  }, []);

  // Navigate to MyRequests when a notification is tapped
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate('MyRequests');
      }
    });
    return () => sub.remove();
  }, []);

  // Watch for status changes and fire local notifications
  useEffect(() => {
    if (!userId) {
      initialized.current = false;
      prevMap.current = {};
      return;
    }

    // Reset on user switch
    initialized.current = false;
    prevMap.current = {};

    const unsub = listenRequests(userId, (requests) => {
      if (!initialized.current) {
        // Populate baseline — don't fire for existing statuses on load
        requests.forEach(r => { prevMap.current[r.id] = r.status; });
        initialized.current = true;
        return;
      }

      requests.forEach(request => {
        const prev = prevMap.current[request.id];
        const statusChanged = prev !== undefined && prev !== request.status;

        if (statusChanged && NOTIFIABLE.has(request.status)) {
          scheduleStatusNotification(request);
        }

        prevMap.current[request.id] = request.status;
      });
    });

    return unsub;
  }, [userId]);
}
