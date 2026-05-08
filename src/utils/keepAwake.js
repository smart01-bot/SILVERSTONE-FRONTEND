import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

// Call when main agent is processing queue — prevents screen sleeping mid-transfer
export const startKeepAwake = async () => {
  try {
    await activateKeepAwakeAsync('queue-processing');
  } catch {}
};

// Call when done processing
export const stopKeepAwake = () => {
  try {
    deactivateKeepAwake('queue-processing');
  } catch {}
};
