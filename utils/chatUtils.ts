export function getChatId(userId1: string, userId2: string) {
  return [userId1, userId2].sort().join('_');
}

export function formatMessageTime(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (diffHour < 1) {
    if (diffMin < 1) {
      return `${diffSec} second${diffSec === 1 ? '' : 's'} ago`;
    }
    return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  } else if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (isYesterday) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
} 