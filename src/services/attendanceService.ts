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
      let locationName = "Geofencing Pulse...";

      try {
        const getPos = (options: PositionOptions) => new Promise<GeolocationPosition>((resolve, reject) => {
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
        } catch (e) {
          // Fallback to low accuracy
          console.warn("High accuracy failed, falling back to low accuracy", e);
          position = await getPos({
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000
          });
        }
        
        lat = position.coords.latitude;
        lng = position.coords.longitude;

        // Reverse Geocode
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
            headers: {
              'Accept-Language': 'en-US,en;q=0.9'
            }
          });
          const data = await response.json();
          // Extract a readable portion of the address
          const address = data.address;
          const display = [
            address?.road || address?.pedestrian || address?.suburb,
            address?.city || address?.town || address?.village
          ].filter(Boolean).join(', ') || data.display_name;
          
          locationName = display || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        } catch (e) {
          console.warn("Geocoding failed", e);
          locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
      } catch (geoErr) {
        console.error("Punch-in location failed significantly", geoErr);
        locationName = "Location Signal Lost";
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
      handleFirestoreError(error, OperationType.CREATE, 'attendance');
      throw error;
    }
  },

  async punchOut(attendanceId: string, userId: string, durationMinutes: number): Promise<void> {
    try {
      // Get current position for punch out - make it non-blocking
      let lat = 0;
      let lng = 0;
      let locationName = "Geofencing Pulse...";

      try {
        const getPos = (options: PositionOptions) => new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });

        let position: GeolocationPosition;
        try {
          position = await getPos({
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          });
        } catch (e) {
          console.warn("High accuracy punch-out failed, falling back", e);
          position = await getPos({
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000
          });
        }
        
        lat = position.coords.latitude;
        lng = position.coords.longitude;

        // Reverse Geocode
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
            headers: {
              'Accept-Language': 'en-US,en;q=0.9'
            }
          });
          const data = await response.json();
          const address = data.address;
          const display = [
            address?.road || address?.pedestrian || address?.suburb,
            address?.city || address?.town || address?.village
          ].filter(Boolean).join(', ') || data.display_name;
          
          locationName = display || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        } catch (e) {
          locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
      } catch (geoErr) {
        console.warn("Punch-out location failed significantly", geoErr);
        locationName = "Location Signal Lost";
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
