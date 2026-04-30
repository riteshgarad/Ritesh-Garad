import { auth } from '../App';

export async function sendEmail(payload: { 
  requesterEmail: string; 
  amount: string;
  status: string;
  requesterName?: string;
  message?: string;
  reason?: string;
  type?: string;
}) {
  // Use the absolute URL for the mobile app, but allow fallback to current origin for dev/preview
  const VERCEL_URL = 'https://ritesh-garad.vercel.app/api/send-email';
  const LOCAL_URL = `${window.location.origin}/api/send-email`;
  
  // Try the Vercel URL first (as requested for the production/mobile setup)
  // but if we are in the preview environment, we should probably use the local server
  const isDevelopment = window.location.hostname.includes('asia-southeast1.run.app') || window.location.hostname === 'localhost';
  const targetUrl = isDevelopment ? LOCAL_URL : VERCEL_URL;
  
  try {
    console.log('[Email Trigger] Dispatching to endpoint:', targetUrl, payload);
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to send email';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('[Email Trigger] Transmission Success:', result);
    return result;
  } catch (error: any) {
    console.error('[Email Trigger] Fatal Error detected in mobile environment:', error);
    // Log detailed error for mobile console debugging
    if (error.message === 'Failed to fetch') {
      console.error('[CORS/Network] Fetch failed. This usually indicates a CORS blockage or missing absolute URL.');
    }
    throw error;
  }
}
