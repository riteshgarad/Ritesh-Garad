import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  or,
  and,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../App';
import { AppUser, ChatMessage } from '../types';
import { cn } from '../lib/utils';
import { Shield } from 'lucide-react';
import { sendPushNotification } from '../lib/push';
import { handleFirestoreError, OperationType } from '../lib/firestore_errors';
import { ChatList } from './chat/ChatList';
import { ChatWindow } from './chat/ChatWindow';
import { MessageInput } from './chat/MessageInput';

interface ChatViewProps {
  user: AppUser;
  operators: AppUser[];
}

export function ChatView({ user, operators }: ChatViewProps) {
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Filter operators for sidebar
  const contacts = operators.filter(o => o.uid !== user.uid && 
    (o.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     o.role?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Fetch unread counts for all conversations
  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // If it's a global message, anyone except the sender sees it as unread until they open it
        // Note: In a true production app, we'd track per-user read status for global, 
        // but for this prototype we'll track if the user has seen the global thread.
        if (data.recipientId === 'global' && data.senderId !== user.uid) {
          counts['global'] = (counts['global'] || 0) + 1;
        } else if (data.recipientId === user.uid) {
          counts[data.senderId] = (counts[data.senderId] || 0) + 1;
        }
      });
      setUnreadCounts(counts);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'messages');
    });

    return () => unsubscribe();
  }, [user.uid]);

  // Mark messages as read when opening a thread
  useEffect(() => {
    if (!selectedRecipientId) return;

    // Direct query for unread messages in the active thread
    let unreadQuery;
    if (selectedRecipientId === 'global') {
      unreadQuery = query(
        collection(db, 'messages'),
        where('recipientId', '==', 'global'),
        where('read', '==', false)
      );
    } else {
      unreadQuery = query(
        collection(db, 'messages'),
        where('senderId', '==', selectedRecipientId),
        where('recipientId', '==', user.uid),
        where('read', '==', false)
      );
    }

    const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
      snapshot.docs.forEach(async (msgDoc) => {
        // Mark as read in Firestore
        if (msgDoc.data().senderId !== user.uid) {
          try {
            await updateDoc(msgDoc.ref, { read: true });
          } catch (err) {
            console.error("Mark as read error:", err);
          }
        }
      });
    }, (err) => {
      console.error("Unread snapshot error:", err);
    });

    return () => unsubscribe();
  }, [selectedRecipientId, user.uid]);

  useEffect(() => {
    if (!selectedRecipientId) return;

    let q;
    if (selectedRecipientId === 'global') {
      q = query(
        collection(db, 'messages'),
        where('recipientId', '==', 'global'),
        orderBy('timestamp', 'asc'),
        limit(50)
      );
    } else {
      q = query(
        collection(db, 'messages'),
        or(
          and(where('senderId', '==', user.uid), where('recipientId', '==', selectedRecipientId)),
          and(where('senderId', '==', selectedRecipientId), where('recipientId', '==', user.uid))
        ),
        orderBy('timestamp', 'asc'),
        limit(50)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      
      setMessages(msgs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `messages [recipient: ${selectedRecipientId}]`);
    });

    return () => unsubscribe();
  }, [selectedRecipientId, user.uid]);

  const handleSendMessage = async (text: string, attachment?: { url: string; name: string; type: string; isImage: boolean }) => {
    if (!text.trim() && !attachment) return;

    const messageData = {
      text: text,
      senderId: user.uid,
      senderName: user.name,
      recipientId: selectedRecipientId,
      timestamp: serverTimestamp(),
      read: false,
      attachment: attachment || null
    };

    try {
      await addDoc(collection(db, 'messages'), messageData);
      
      // Trigger Push Notification for the recipient
      if (selectedRecipientId !== 'global') {
        const recipient = operators.find(o => o.uid === selectedRecipientId);
        sendPushNotification({
          title: `Message from ${user.name} 💬`,
          message: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
          externalIds: [selectedRecipientId]
        });
      } else {
        sendPushNotification({
          title: 'General Ops Message 📡',
          message: `${user.name}: ${text.slice(0, 50)}`,
          segment: 'Subscribed Users'
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'messages');
    }
  };

  const selectedRecipient = selectedRecipientId === 'global' 
    ? { uid: 'global', name: 'General Operations', role: 'Global Node' }
    : operators.find(o => o.uid === selectedRecipientId);

  return (
    <div className="flex h-full bg-white overflow-hidden">
      {/* Sidebar Interface */}
      <div className={cn(
        "transition-all duration-300 ease-in-out shrink-0 h-full",
        selectedRecipientId ? "hidden md:block w-80" : "w-full"
      )}>
        <ChatList 
          user={user}
          contacts={contacts}
          selectedId={selectedRecipientId}
          onSelect={setSelectedRecipientId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          unreadCounts={unreadCounts}
        />
      </div>

      {/* Thread Interface */}
      <div className={cn(
        "flex-1 flex flex-col h-full bg-[#FAF7F2] transition-all duration-300",
        !selectedRecipientId ? "hidden md:flex" : "flex"
      )}>
        {selectedRecipientId && selectedRecipient ? (
          <>
            <ChatWindow 
              user={user}
              recipient={selectedRecipient}
              messages={messages}
              onBack={() => setSelectedRecipientId('')}
            />
            <MessageInput onSend={handleSendMessage} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40 bg-white">
            <div className="w-24 h-24 bg-mahogany/5 rounded-[3rem] flex items-center justify-center text-mahogany/20 mb-8 border border-mahogany/5">
               <Shield size={40} />
            </div>
            <h3 className="text-[14px] font-black text-mahogany uppercase tracking-[0.3em] mb-3">Bridge Standby</h3>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest max-w-[280px] leading-loose">
               Select a mission channel or personnel node to establish a digital bridge for NGO operations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
