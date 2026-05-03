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
        if (typeof window !== 'undefined') {
          const win = window as any;
          if (win.median?.location?.get) {
             win.median.location.get().then((data: any) => {
               if (data && data.latitude) {
                 resolve({
                   coords: { latitude: data.latitude, longitude: data.longitude, accuracy: data.accuracy || 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
                   timestamp: Date.now()
                 } as GeolocationPosition);
               } else {
                  standardGetPos(options, resolve, reject);
               }
             }).catch(() => standardGetPos(options, resolve, reject));
             return;
          }
        }
        standardGetPos(options, resolve, reject);
      });

      const standardGetPos = (options: PositionOptions, resolve: any, reject: any) => {
        if (!navigator.geolocation) {
          reject({ code: 0, message: "Geolocation not supported" });
          return;
        }
        const baseTimeout = options.timeout || 5000;
        const nativeBuffer = isNativeApp() ? 60000 : 5000; 
        const timer = setTimeout(() => reject({ code: 3, message: "Internal Timeout" }), baseTimeout + nativeBuffer);
        
        navigator.geolocation.getCurrentPosition(
          (pos) => { clearTimeout(timer); resolve(pos); },
          (err) => { clearTimeout(timer); reject(err); },
          options
        );
      };

      let position: GeolocationPosition | null = null;
      const nativeMult = isNativeApp() ? 3 : 1;

      try {
        if (isNativeApp()) {
          const win = window as any;
          if (win.gonative) win.location.href = "gonative://permissions/request?permission=location";
          if (win.median?.location?.promptPermission) win.median.location.promptPermission();
        }

        try {
          position = await getPos({
            enableHighAccuracy: false,
            timeout: 2000,
            maximumAge: Infinity
          });
        } catch (e) {
          console.log("GPS: Cache miss");
        }

        if (!position) {
          position = await getPos({
            enableHighAccuracy: true,
            timeout: 25000 * nativeMult, 
            maximumAge: 15000 
          });
        }
      } catch (err: any) {
        console.warn("GPS: Complex search failed", err);
        if (err.code === 1) throw new Error("LOCATION_PERM_DENIED");
        
        try {
          position = await getPos({
            enableHighAccuracy: false,
            timeout: 20000 * nativeMult,
            maximumAge: 600000 
          });
        } catch (fallbackErr: any) {
          console.error("GPS capture failed completely:", fallbackErr);
          if (fallbackErr.code === 1) throw new Error("LOCATION_PERM_DENIED");
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

      try {
        const docRef = await addDoc(collection(db, 'attendance'), attendanceData);
        return { id: docRef.id, locationName };
      } catch (dbErr: any) {
        console.error("Attendance Write Error:", dbErr);
        if (dbErr.code === 'permission-denied') throw new Error("DB_PERMISSION_DENIED");
        if (dbErr.code === 'unavailable') throw new Error("DB_OFFLINE");
        throw new Error(`DB_FAILURE: ${dbErr.message || 'Unknown'}`);
      }
    } catch (error: any) {
      // Re-throw known logic errors
      if (['LOCATION_PERM_DENIED', 'DB_PERMISSION_DENIED', 'DB_OFFLINE'].includes(error.message)) {
        throw error;
      }
      if (error.message && error.message.startsWith('DB_FAILURE')) throw error;
      
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
        if (typeof window !== 'undefined') {
          const win = window as any;
          if (win.median?.location?.get) {
             win.median.location.get().then((data: any) => {
                if (data && data.latitude) {
                  resolve({
                    coords: { latitude: data.latitude, longitude: data.longitude, accuracy: data.accuracy || 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
                    timestamp: Date.now()
                  } as GeolocationPosition);
                } else {
                  standardGetPos(options, resolve, reject);
                }
             }).catch(() => standardGetPos(options, resolve, reject));
             return;
          }
        }
        standardGetPos(options, resolve, reject);
      });

      const standardGetPos = (options: PositionOptions, resolve: any, reject: any) => {
        if (!navigator.geolocation) {
          reject({ code: 0, message: "Geolocation not supported" });
          return;
        }
        const baseTimeout = options.timeout || 5000;
        const nativeBuffer = isNativeApp() ? 40000 : 5000;
        const timer = setTimeout(() => reject({ code: 3, message: "Internal Timeout" }), baseTimeout + nativeBuffer);
        
        navigator.geolocation.getCurrentPosition(
          (pos) => { clearTimeout(timer); resolve(pos); },
          (err) => { clearTimeout(timer); reject(err); },
          options
        );
      };

      try {
        let position: GeolocationPosition | null = null;
        const nativeMult = isNativeApp() ? 2.5 : 1;
        
        try {
          position = await getPos({
            enableHighAccuracy: false,
            timeout: 2000,
            maximumAge: Infinity
          });
        } catch (e) {
          try {
            position = await getPos({
              enableHighAccuracy: true,
              timeout: 15000 * nativeMult,
              maximumAge: 10000
            });
          } catch (deepErr) {
            console.warn("Deep GPS search failed for punch-out", deepErr);
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
