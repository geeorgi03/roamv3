import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey);

export const API_BASE_URL = `${supabaseUrl}/functions/v1/make-server-837ff822`;

// Helper to make authenticated API requests
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token || publicAnonKey;

  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
}

// Helper for file uploads
export async function uploadFile(
  file: File,
  type: 'video' | 'audio'
): Promise<{ path: string; url: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token || publicAnonKey;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
}
