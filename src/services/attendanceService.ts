import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  orderBy, 
  limit,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Attendance } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const attendanceService = {
  async punchIn(userId: string, userName: string, projectId: string, missionName: string): Promise<string> {
    try {
      // Get Geolocation
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      const attendanceData = {
        userId,
        userName,
        projectId,
        missionName,
        location: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        },
        punchIn: serverTimestamp(),
        status: 'active' as const,
      };

      const docRef = await addDoc(collection(db, 'attendance'), attendanceData);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'attendance');
      throw error;
    }
  },

  async punchOut(attendanceId: string, userId: string, durationMinutes: number): Promise<void> {
    try {
      const attendanceRef = doc(db, 'attendance', attendanceId);
      await updateDoc(attendanceRef, {
        punchOut: serverTimestamp(),
        status: 'completed' as const,
        durationMinutes
      });

      // Update volunteer total hours
      // Note: In a real app, you might want to find the volunteer doc by userId
      // Here assuming we can find the volunteer doc where uid == userId
      const volunteerQuery = query(collection(db, 'users'), where('uid', '==', userId), limit(1));
      const volunteerSnap = await getDocs(volunteerQuery);
      
      if (!volunteerSnap.empty) {
        const volunteerDoc = volunteerSnap.docs[0];
        await updateDoc(doc(db, 'users', volunteerDoc.id), {
          hours: increment(durationMinutes / 60)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `attendance/${attendanceId}`);
      throw error;
    }
  },

  async getActiveSession(userId: string): Promise<Attendance | null> {
    try {
      const q = query(
        collection(db, 'attendance'), 
        where('userId', '==', userId), 
        where('status', '==', 'active'),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return null;
      
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Attendance;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'attendance');
      return null;
    }
  },

  async getRecentSessions(userId: string, limitCount: number = 5): Promise<Attendance[]> {
    try {
      const q = query(
        collection(db, 'attendance'),
        where('userId', '==', userId),
        where('status', '==', 'completed'),
        orderBy('punchIn', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'attendance');
      return [];
    }
  }
};
