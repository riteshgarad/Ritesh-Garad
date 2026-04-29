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
  const ABSOLUTE_URL = 'https://ritesh-garad.vercel.app/api/send-email';
  
  try {
    console.log('[Email Trigger] Dispatching to absolute endpoint:', ABSOLUTE_URL, payload);
    
    // Using absolute URL to bypass mobile wrapper relative-path limitations
    const response = await fetch(ABSOLUTE_URL, {
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
