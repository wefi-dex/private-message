// API utility for backend integration
import Constants from 'expo-constants';

const BASE_URL = (Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000') + '/api';

export async function login(username: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

export async function createUser(user: Record<string, any>) {
  // Ensure role is sent as a string
  const userWithRole = { ...user, role: user.role === 'creator' ? 'creator' : 'fan' };
  const res = await fetch(`${BASE_URL}/user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userWithRole),
  });
  if (!res.ok) {
    let errorMsg = 'User creation failed';
    try {
      const err = await res.json();
      if (err && err.message) errorMsg = err.message;
    } catch {}
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function getUser(id: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}/user/${id}`, { headers });
  if (!res.ok) throw new Error('Get user failed');
  return res.json();
}

export async function updateUser(id: string, user: Record<string, any>, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}/user/${id}` , {
    method: 'PUT',
    headers,
    body: JSON.stringify(user),
  });
  if (!res.ok) {
    let errorMsg = 'Update user failed';
    try {
      const err = await res.json();
      if (err && err.message) errorMsg = err.message;
    } catch {}
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function deleteUser(id: string) {
  const res = await fetch(`${BASE_URL}/user/${id}`, {
    method: 'DELETE' });
  if (!res.ok) throw new Error('Delete user failed');
  return res.json();
}

export async function uploadFile(file: File | Blob, token: string, filename: string) {
  const formData = new FormData();
  formData.append('file', file, filename);
  const res = await fetch(`${BASE_URL}/file/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  if (!res.ok) throw new Error('File upload failed');
  return res.json();
}

export async function getUsers(token?: string) {
  const res = await fetch(`${BASE_URL}/users`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch users');
  return data.data;
}

export async function checkUsernameDuplicate(username: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}/check-username?username=${encodeURIComponent(username)}`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to check username');
  const data = await res.json();
  return data.available;
}

export async function createUserConnection(user_id: string, target_user_id: string, token?: string) {
  const res = await fetch(`${BASE_URL}/connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ user_id, target_user_id }),
  });

  let data;
  try {
    data = await res.json();
  } catch (e: any) {
    const text = await res.text();
    console.error('Non-JSON response:', text);
    throw new Error(text || 'Failed to send connection request');
  }
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to send connection request');
  }
  return data;
}

export async function getUserConnectionStatus(user_id: string, target_user_id: string, token?: string) {
  const res = await fetch(`${BASE_URL}/user/connection-status?user_id=${user_id}&target_user_id=${target_user_id}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    const text = await res.text();
    throw new Error(text || 'Failed to get connection status');
  }
  if (!res.ok) {
    throw new Error(data.message || 'Failed to get connection status');
  }
  return data.status;
}

export async function getUserByUsername(username: string, user_id?: string, token?: string) {
  const url = `${BASE_URL}/by-username?username=${encodeURIComponent(username)}${user_id ? `&user_id=${user_id}` : ''}`;
  const res = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    const text = await res.text();
    throw new Error(text || 'Failed to get user');
  }
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to get user');
  }
  return data.data;
}

export function getFileUrl(filename: string) {
  return `${BASE_URL}/file/${filename}`;
}

export async function getPendingConnectionRequests(userId: string, token?: string) {
  const res = await fetch(`${BASE_URL}/user-connection/${userId}/pending-requests`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    const text = await res.text();
    throw new Error(text || 'Failed to get pending requests');
  }
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to get pending requests');
  }
  return data.data;
}

export async function respondToConnectionRequest(connectionId: string, action: 'accept' | 'reject', token?: string) {
  const res = await fetch(`${BASE_URL}/connection/${connectionId}/respond`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action }),
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    const text = await res.text();
    throw new Error(text || 'Failed to respond to request');
  }
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to respond to request');
  }
  return data;
}

export async function getConnectionHistory(userId: string, token?: string) {
  const res = await fetch(`${BASE_URL}/user-connection/${userId}/history`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    const text = await res.text();
    throw new Error(text || 'Failed to get connection history');
  }
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to get connection history');
  }
  return data.data;
}

export async function getConnectedUsers(userId: string, token?: string) {
  const res = await fetch(`${BASE_URL}/user-connection/${userId}/connected`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    const text = await res.text();
    throw new Error(text || 'Failed to get connected users');
  }
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to get connected users');
  }
  return data.data;
} 

// Block and Report API functions
export async function blockUser(blockerId: string, blockedId: string, token?: string) {
  const res = await fetch(`${BASE_URL}/block`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ blocker_id: blockerId, blocked_id: blockedId }),
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    const text = await res.text();
    throw new Error(text || 'Failed to block user');
  }
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to block user');
  }
  return data;
}

export async function unblockUser(blockerId: string, blockedId: string, token?: string) {
  const res = await fetch(`${BASE_URL}/unblock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ blocker_id: blockerId, blocked_id: blockedId }),
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    const text = await res.text();
    throw new Error(text || 'Failed to unblock user');
  }
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to unblock user');
  }
  return data;
}

export async function getBlockedUsers(userId: string, token?: string) {
  const res = await fetch(`${BASE_URL}/user/${userId}/blocked`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    const text = await res.text();
    throw new Error(text || 'Failed to get blocked users');
  }
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to get blocked users');
  }
  return data.data;
}

export async function checkIfBlocked(userId: string, targetUserId: string, token?: string) {
  const res = await fetch(`${BASE_URL}/block-status?user_id=${userId}&target_user_id=${targetUserId}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    const text = await res.text();
    throw new Error(text || 'Failed to check block status');
  }
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to check block status');
  }
  return data.data;
}

export async function reportUser(reporterId: string, reportedId: string, reason: string, description?: string, token?: string) {
  const res = await fetch(`${BASE_URL}/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ 
      reporter_id: reporterId, 
      reported_id: reportedId, 
      reason, 
      description 
    }),
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    const text = await res.text();
    throw new Error(text || 'Failed to report user');
  }
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to report user');
  }
  return data;
}

export async function getUserReports(userId: string, token?: string) {
  const res = await fetch(`${BASE_URL}/user/${userId}/reports`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    const text = await res.text();
    throw new Error(text || 'Failed to get user reports');
  }
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to get user reports');
  }
  return data.data;
}