import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Innovation } from '../types';

export const innovationService = {
  async submitIdea(data: Omit<Innovation, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const path = 'innovations';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...data,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return ''; // unreachable due to throw in handler
    }
  },

  async getUserIdeas(userId: string): Promise<Innovation[]> {
    const path = 'innovations';
    try {
      const q = query(
        collection(db, path),
        where('submittedBy', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Innovation));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return []; // unreachable
    }
  }
};
