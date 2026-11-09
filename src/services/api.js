const API_BASE = '/api';

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function uploadAndAnalyze(file, algorithm = 'auto', contamination = 0.05) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('algorithm', algorithm);
  formData.append('contamination', contamination.toString());

  const response = await fetch(`${API_BASE}/upload-and-analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Analysis failed.' }));
    throw new Error(errorData.detail || `Upload failed with status: ${response.status}`);
  }

  return response.json();
}

export async function analyzeSample(sampleType = 'financial', algorithm = 'auto', contamination = 0.05) {
  const url = `${API_BASE}/sample-analyze?sample_type=${encodeURIComponent(sampleType)}&algorithm=${encodeURIComponent(algorithm)}&contamination=${contamination}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Sample load failed.' }));
    throw new Error(errorData.detail || `Sample request failed with status: ${response.status}`);
  }

  return response.json();
}

export function getExportUrl(type, sessionId) {
  return `${API_BASE}/export/${type}?session_id=${encodeURIComponent(sessionId)}`;
}

export async function downloadFile(type, sessionId, defaultFilename) {
  const url = getExportUrl(type, sessionId);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${type} file.`);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  
  // Try to extract filename from header or fallback
  const disposition = response.headers.get('Content-Disposition');
  let filename = defaultFilename;
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename=["']?([^"';]+)["']?/);
    if (match && match[1]) filename = match[1];
  }
  
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

