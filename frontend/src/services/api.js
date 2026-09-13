const BASE_URL = '/api';

const TOKEN_KEY = 'resolveai_auth_token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function getAuthHeaders(customHeaders = {}) {
  const token = getStoredToken();
  const headers = { ...customHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// -------------------------------------------------------------
// Authentication APIs
// -------------------------------------------------------------

export async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Login failed. Please check credentials.');
  }
  setStoredToken(data.token);
  return data;
}

export async function registerUser(email, name, password, role = 'user') {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password, role })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Registration failed.');
  }
  setStoredToken(data.token);
  return data;
}

export async function fetchCurrentUser() {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      setStoredToken('');
      return null;
    }
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchAllUsers() {
  const res = await fetch(`${BASE_URL}/users`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to load users');
  return await res.json();
}

export function logoutUser() {
  setStoredToken('');
}

// -------------------------------------------------------------
// System Health
// -------------------------------------------------------------

export async function fetchHealth() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Health check failed:', err);
    return { status: 'offline', gemini_configured: false };
  }
}

// -------------------------------------------------------------
// Ticket Operations
// -------------------------------------------------------------

export async function analyzeTicket(description, ticketId = '') {
  const payload = {
    description: description.trim(),
    ticket_id: ticketId.trim() || undefined
  };

  const res = await fetch(`${BASE_URL}/tickets/analyze`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Ticket analysis failed.');
  }
  return data;
}

export async function fetchTickets(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== 'All') params.append('category', filters.category);
  if (filters.priority && filters.priority !== 'All') params.append('priority', filters.priority);
  if (filters.status && filters.status !== 'All') params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);

  const url = `${BASE_URL}/tickets?${params.toString()}`;
  const res = await fetch(url, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch tickets');
  return await res.json();
}

export async function fetchTicketById(ticketId) {
  const res = await fetch(`${BASE_URL}/tickets/${encodeURIComponent(ticketId)}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error(`Failed to load ticket ${ticketId}`);
  return await res.json();
}

export async function approveTicketResolution(ticketId) {
  const res = await fetch(`${BASE_URL}/tickets/${encodeURIComponent(ticketId)}/approve`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to approve resolution');
  }
  return await res.json();
}

export async function routeTicket(ticketId) {
  const res = await fetch(`${BASE_URL}/tickets/${encodeURIComponent(ticketId)}/route`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to route ticket');
  }
  return await res.json();
}

export async function fetchAuditLog(limit = 100) {
  const res = await fetch(`${BASE_URL}/audit-log?limit=${limit}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to load audit log');
  return await res.json();
}

export async function fetchAnalytics() {
  const res = await fetch(`${BASE_URL}/analytics`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to load analytics data');
  return await res.json();
}

export async function clearAllTickets() {
  const res = await fetch(`${BASE_URL}/tickets/clear`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to clear tickets');
  }
  return await res.json();
}
