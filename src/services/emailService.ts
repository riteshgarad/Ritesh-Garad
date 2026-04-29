import { auth } from '../App';

export async function sendEmail(payload: { 
  type?: 'REQUEST_TO_FINANCE' | 'DECISION_TO_VOLUNTEER';
  to?: string; 
  subject?: string; 
  html?: string; 
  text?: string;
  amount?: string;
  requesterName?: string;
  requesterEmail?: string;
  message?: string;
  status?: string;
  reason?: string;
}) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const token = await user.getIdToken();
    const response = await fetch('/api/automation/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send email');
    }

    return await response.json();
  } catch (error) {
    console.error('[Email Service Error]:', error);
    throw error;
  }
}
