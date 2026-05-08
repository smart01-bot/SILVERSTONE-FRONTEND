import * as Clipboard from 'expo-clipboard';

export const copyToClipboard = async (text) => {
  await Clipboard.setStringAsync(text);
};

export const copyRequestId = async (id) => {
  if (!id) return;
  await Clipboard.setStringAsync(id);
};

export const shareReceipt = async (request) => {
  if (!request) return;
  const text = [
    'Silverstone Float Request Receipt',
    '--------------------------------',
    `ID:     ${request.id?.slice(-8).toUpperCase() ?? '--------'}`,
    `Route:  ${request.sourceNetwork} → ${request.destNetwork}`,
    `Amount: TZS ${Number(request.amount).toLocaleString()}`,
    `Status: ${request.status}`,
    `Date:   ${new Date().toLocaleDateString()}`,
    '--------------------------------',
    'Silverstone Mobile Money Platform',
  ].join('\n');
  await Clipboard.setStringAsync(text);
};
