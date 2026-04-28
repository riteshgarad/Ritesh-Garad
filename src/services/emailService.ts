import { auth } from '../App';

export async function sendEmail({ to, subject, html, text }: { to?: string; subject: string; html: string; text?: string }) {
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
      body: JSON.stringify({ to, subject, html, text })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send email');
    }

    return await response.json();
  } catch (error) {
    console.error('[Email Service Error]:', error);
    // Don't throw error to prevent UI blocking, just log it. 
    // We can show a toast from the caller if needed.
    return { success: false, error };
  }
}
