import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';

const fmt = (n) => `TZS ${Number(n).toLocaleString('en-TZ')}`;

const fmtDate = (ts) => {
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-TZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const generateReceiptText = (request) => {
  const {
    id, agentName, sourceNetwork, destNetwork,
    sourcePhone, destPhone, amount, status,
    createdAt, processedBy,
  } = request;

  return `
*SILVERSTONE FLOAT RECEIPT*
━━━━━━━━━━━━━━━━━━━
Date: ${fmtDate(createdAt)}
Request ID: #${id?.slice(-8).toUpperCase()}

*Route:* ${sourceNetwork} → ${destNetwork}
*Amount:* ${fmt(amount)}

*From:* ${sourcePhone}
*To:* ${destPhone}

*Agent:* ${agentName}
*Status:* ${status === 'completed' ? '✅ Completed' : status}

_Powered by Silverstone Inc._
_Tanzania's First Float Management System_
`.trim();
};

// Share receipt via WhatsApp or any app
// Falls back to clipboard since Sharing.shareAsync requires a file URI
export const shareReceipt = async (request) => {
  const text = generateReceiptText(request);
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    await Clipboard.setStringAsync(text);
    return { shared: false, copied: true };
  }
  await Clipboard.setStringAsync(text);
  return { shared: false, copied: true, text };
};

export const copyToClipboard = async (text) => {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
};

export const copyRequestId = async (requestId) => {
  const shortId = requestId?.slice(-8).toUpperCase();
  await Clipboard.setStringAsync(shortId);
  return shortId;
};
