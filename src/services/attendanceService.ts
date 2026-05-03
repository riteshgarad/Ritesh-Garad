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
import { isNativeApp } from './notificationService';

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
        // Increased safety timeout significantly for Native Apps to allow for OS permission prompts
        const baseTimeout = options.timeout || 5000;
        const nativeBuffer = isNativeApp() ? 40000 : 2000; // 40s extra for native prompts
        const timer = setTimeout(() => reject(new Error("Internal Timeout")), baseTimeout + nativeBuffer);
        
        navigator.geolocation.getCurrentPosition(
          (pos) => { clearTimeout(timer); resolve(pos); },
          (err) => { clearTimeout(timer); reject(err); },
          options
        );
      });

      let position: GeolocationPosition | null = null;
      const nativeMult = isNativeApp() ? 2.5 : 1;

      try {
        // Preference for high accuracy mission data - increased timeout for native bridges
        position = await getPos({
          enableHighAccuracy: true,
          timeout: 20000 * nativeMult, 
          maximumAge: 0
        });
      } catch (err: any) {
        console.warn("High accuracy GPS failed, trying fallback...", err);
        try {
          // Standard accuracy fallback - increased timeout
          position = await getPos({
            enableHighAccuracy: false,
            timeout: 15000 * nativeMult,
            maximumAge: 60000 
          });
        } catch (fallbackErr: any) {
          console.error("GPS capture failed completely:", fallbackErr);
          // If denied or timed out, position remains null
        }
      }
      
      if (position) {
        lat = position.coords.latitude;
        lng = position.coords.longitude;

        // Reverse Geocode
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
            headers: {
              'Accept-Language': 'en',
              'User-Agent': 'GaradFoundationMissionApp/1.0'
            }
          });
          const data = await response.json();
          
          if (data && data.display_name) {
            // Take a concise version of the address
            const addr = data.address;
            const parts = [
              addr.road || addr.pedestrian || addr.suburb,
              addr.city || addr.town || addr.village
            ].filter(Boolean);
            
            locationName = parts.length > 0 ? parts.join(', ') : data.display_name;
          } else {
            locationName = `LAT: ${lat.toFixed(6)}, LNG: ${lng.toFixed(6)}`;
          }
        } catch (e) {
          locationName = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
      } else {
        locationName = "Mission Node (No GPS)";
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
        const baseTimeout = options.timeout || 5000;
        const nativeBuffer = isNativeApp() ? 30000 : 2000;
        const timer = setTimeout(() => reject(new Error("Internal Timeout")), baseTimeout + nativeBuffer);
        
        navigator.geolocation.getCurrentPosition(
          (pos) => { clearTimeout(timer); resolve(pos); },
          (err) => { clearTimeout(timer); reject(err); },
          options
        );
      });

      try {
        let position: GeolocationPosition | null = null;
        const nativeMult = isNativeApp() ? 2 : 1;
        
        try {
          // Attempt high accuracy wait
          position = await getPos({
            enableHighAccuracy: true,
            timeout: 15000 * nativeMult,
            maximumAge: 0
          });
        } catch (e) {
          // Standard fallback
          position = await getPos({
            enableHighAccuracy: false,
            timeout: 10000 * nativeMult,
            maximumAge: 60000
          });
        }
        
        if (position) {
          lat = position.coords.latitude;
          lng = position.coords.longitude;

          // Reverse Geocode
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
              headers: {
                'Accept-Language': 'en',
                'User-Agent': 'GaradFoundationMissionApp/1.0'
              }
            });
            const data = await response.json();
            if (data && data.display_name) {
              const addr = data.address;
              const parts = [
                addr.road || addr.pedestrian || addr.suburb,
                addr.city || addr.town || addr.village
              ].filter(Boolean);
              locationName = parts.length > 0 ? parts.join(', ') : data.display_name;
            } else {
              locationName = `LAT: ${lat.toFixed(6)}, LNG: ${lng.toFixed(6)}`;
            }
          } catch (e) {
            locationName = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          }
        } else {
          locationName = "Mission Node (No GPS)";
        }
      } catch (geoErr) {
        console.warn("Punch-out location failed tracking", geoErr);
        locationName = "Mission Node (Fallback)";
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
