/**
 * AccessHire API Client Helper
 * Lightweight fetch wrappers with clear error handling.
 */

const BASE_URL = '/api';

/**
 * Handle API responses safely and throw user-friendly error messages
 */
async function handleResponse(response) {
  let data = null;
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorMsg = data && data.error ? data.error : `Request failed with HTTP status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    throw err;
  }

  return data;
}

// -----------------------------------------------------------------------------
// Profile API
// -----------------------------------------------------------------------------
export async function getProfile() {
  const res = await fetch(`${BASE_URL}/profile`);
  return handleResponse(res);
}

export async function updateProfile(profileData) {
  const res = await fetch(`${BASE_URL}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData)
  });
  return handleResponse(res);
}

export async function importResume(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/profile/import-resume`, {
    method: 'POST',
    body: formData
  });
  return handleResponse(res);
}

// -----------------------------------------------------------------------------
// Analysis API
// -----------------------------------------------------------------------------
export async function analyzeJobText(jobText) {
  const res = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobText })
  });
  return handleResponse(res);
}

export async function analyzeJobFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/analyze/upload`, {
    method: 'POST',
    body: formData
  });
  return handleResponse(res);
}

export async function analyzeJobUrl(url) {
  const res = await fetch(`${BASE_URL}/analyze/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  return handleResponse(res);
}

// -----------------------------------------------------------------------------
// Saved Applications API
// -----------------------------------------------------------------------------
export async function getApplications() {
  const res = await fetch(`${BASE_URL}/applications`);
  return handleResponse(res);
}

export async function getApplicationById(id) {
  const res = await fetch(`${BASE_URL}/applications/${encodeURIComponent(id)}`);
  return handleResponse(res);
}

export async function updateApplicationProgress(id, completedSteps) {
  const res = await fetch(`${BASE_URL}/applications/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completedSteps })
  });
  return handleResponse(res);
}

export async function deleteApplication(id) {
  const res = await fetch(`${BASE_URL}/applications/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  return handleResponse(res);
}

// -----------------------------------------------------------------------------
// Resume Generation & Tailoring API (Phase 4)
// -----------------------------------------------------------------------------
export async function getResumeReadiness(applicationId) {
  const query = applicationId ? `?applicationId=${encodeURIComponent(applicationId)}` : '';
  const res = await fetch(`${BASE_URL}/resume/readiness${query}`);
  return handleResponse(res);
}

export async function tailorResume({ applicationId, job } = {}) {
  const res = await fetch(`${BASE_URL}/resume/tailor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId, job })
  });
  return handleResponse(res);
}

export async function renderResume({ resume, format = 'docx' }) {
  const res = await fetch(`${BASE_URL}/resume/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume, format })
  });

  if (!res.ok) {
    let errorMsg = `Download failed with HTTP status ${res.status}`;
    try {
      const errData = await res.json();
      if (errData && errData.error) errorMsg = errData.error;
    } catch {
      // response might be non-JSON
    }
    const err = new Error(errorMsg);
    err.status = res.status;
    throw err;
  }

  const blob = await res.blob();

  // Extract filename from Content-Disposition header if available
  const disposition = res.headers.get('content-disposition') || '';
  let filename = `Resume.${format}`;
  const filenameMatch = disposition.match(/filename="?([^";]+)"?/);
  if (filenameMatch && filenameMatch[1]) {
    filename = filenameMatch[1];
  }

  // Trigger browser download via object URL
  if (typeof window !== 'undefined' && window.document) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  }

  return blob;
}

