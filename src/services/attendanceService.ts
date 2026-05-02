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
import { db, auth } from '../lib/firebase';
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
  let errorMessage = String(error);
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'object' && error !== null) {
    // Handle GeolocationPositionError which doesn't stringify well
    const geoError = error as any;
    if (geoError.code !== undefined && geoError.message !== undefined) {
      errorMessage = `GeoError(${geoError.code}): ${geoError.message}`;
    } else {
      try {
        errorMessage = JSON.stringify(error);
      } catch (e) {
        errorMessage = "Complex Error Object";
      }
    }
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
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
  async punchIn(userId: string, userName: string, projectId: string, missionName: string): Promise<{ id: string, locationName: string }> {
    try {
      // Get Geolocation
      let lat = 0;
      let lng = 0;
      let locationName = "";

      const getPos = (options: PositionOptions) => new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

      let position: GeolocationPosition;
      try {
        // Try high accuracy first
        position = await getPos({
          enableHighAccuracy: true,
          timeout: 15000, 
          maximumAge: 0
        });
      } catch (err: any) {
        // Fallback to low accuracy / cached
        if (err.code === 1) throw err; // If PERMISSION_DENIED, throw immediately to UI
        
        console.warn("High accuracy failed, attempting fallback", err);
        position = await getPos({
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000 
        });
      }
      
      lat = position.coords.latitude;
      lng = position.coords.longitude;

      // Reverse Geocode
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
          headers: {
            'Accept-Language': 'en-IN,en-US,en;q=0.9',
            'User-Agent': 'GaradFoundationMissionApp/1.0 (riteshgerad@gmail.com)'
          }
        });
        const data = await response.json();
        
        if (data && data.address) {
          const addr = data.address;
          const parts = [
            addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood,
            addr.city || addr.town || addr.village || addr.district
          ].filter(Boolean);
          
          locationName = parts.length > 0 ? parts.join(', ') : (data.name || data.display_name);
        } else {
          locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
      } catch (e) {
        locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }

      const attendanceData = {
        userId,
        userName,
        projectId,
        missionName,
        location: { lat, lng },
        punchInLocationName: locationName,
        punchIn: serverTimestamp(),
        status: 'active' as const,
      };

      const docRef = await addDoc(collection(db, 'attendance'), attendanceData);
      return { id: docRef.id, locationName };
    } catch (error) {
      // Check if it's a Geolocation error
      if (typeof error === 'object' && error !== null && 'code' in (error as any)) {
        throw error; // Let UI handle geo errors
      }
      handleFirestoreError(error, OperationType.CREATE, 'attendance');
      throw error;
    }
  },

  async punchOut(attendanceId: string, userId: string, durationMinutes: number): Promise<void> {
    try {
      // Get current position for punch out
      let lat = 0;
      let lng = 0;
      let locationName = "Mission Node";

      const getPos = (options: PositionOptions) => new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

      try {
        let position: GeolocationPosition;
        try {
          position = await getPos({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        } catch (e) {
          position = await getPos({
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 60000
          });
        }
        
        lat = position.coords.latitude;
        lng = position.coords.longitude;

        // Reverse Geocode
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
            headers: {
              'Accept-Language': 'en-IN,en-US,en;q=0.9',
              'User-Agent': 'GaradFoundationMissionApp/1.0 (riteshgerad@gmail.com)'
            }
          });
          const data = await response.json();
          if (data && data.address) {
            const addr = data.address;
            const parts = [
              addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood,
              addr.city || addr.town || addr.village || addr.district
            ].filter(Boolean);
            locationName = parts.length > 0 ? parts.join(', ') : data.display_name;
          } else {
            locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          }
        } catch (e) {
          locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
      } catch (geoErr) {
        console.warn("Punch-out location failed tracking", geoErr);
      }

      const attendanceRef = doc(db, 'attendance', attendanceId);
      await updateDoc(attendanceRef, {
        punchOut: serverTimestamp(),
        punchOutLocation: { lat, lng },
        punchOutLocationName: locationName,
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
