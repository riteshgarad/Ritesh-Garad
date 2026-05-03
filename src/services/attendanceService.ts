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

// Detection for native app wrappers like Median/GoNative
export const isNativeApp = () => {
  return typeof window !== 'undefined' && (
    (window as any).gonative || 
    (window as any).median || 
    (window as any).webkit?.messageHandlers?.gonative ||
    (window as any).webkit?.messageHandlers?.median ||
    navigator.userAgent.includes('gonative') ||
    navigator.userAgent.includes('median')
  );
};

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

/**
 * HIGH POWER GPS ACQUISITION
 * Attempts to get the most accurate location across web and native wrappers.
 */
async function getRobustLocation(timeoutMs = 6000): Promise<{ lat: number, lng: number, name: string }> {
  let lat = 0;
  let lng = 0;
  let name = "Mission Node";

  const getPositionPromise = () => new Promise<GeolocationPosition | null>((resolve) => {
    // 1. Check for Median Native API (highest priority for native app)
    const win = window as any;
    if (win.median?.location?.get) {
      win.median.location.get().then((data: any) => {
        if (data && data.latitude) {
          resolve({
            coords: { latitude: data.latitude, longitude: data.longitude, accuracy: data.accuracy || 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
            timestamp: Date.now()
          } as GeolocationPosition);
        } else {
          fallbackToStandard();
        }
      }).catch(() => fallbackToStandard());
      return;
    }

    function fallbackToStandard() {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      const timer = setTimeout(() => resolve(null), timeoutMs);
      
      navigator.geolocation.getCurrentPosition(
        (pos) => { clearTimeout(timer); resolve(pos); },
        () => { clearTimeout(timer); resolve(null); },
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 }
      );
    }

    fallbackToStandard();
  });

  try {
    const pos = await getPositionPromise();
    if (pos) {
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
      name = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      // Try reverse geocode (Osm Nominatim) with 2s timeout
      try {
        const controller = new AbortController();
        const geoTimeout = setTimeout(() => controller.abort(), 2000);
        
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
          headers: { 'Accept-Language': 'en', 'User-Agent': 'GaradMissionApp/2.0' },
          signal: controller.signal
        });
        clearTimeout(geoTimeout);
        
        const data = await res.json();
        if (data?.display_name) {
          const addr = data.address;
          const parts = [addr?.road || addr?.pedestrian || addr?.suburb, addr?.city || addr?.town || addr?.village].filter(Boolean);
          name = parts.length > 0 ? parts.join(', ') : data.display_name.split(',').slice(0, 2).join(',');
        }
      } catch (e) {
        console.warn("Geocode skipped or timed out");
      }
    }
  } catch (err) {
    console.error("GPS Error:", err);
  }

  return { lat, lng, name };
}

export const attendanceService = {
  async punchIn(userId: string, userName: string, projectId: string, missionName: string): Promise<{ id: string, locationName: string }> {
    try {
      // Robust GPS Sync
      const { lat, lng, name: locationName } = await getRobustLocation(isNativeApp() ? 10000 : 5000);

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
        if (dbErr.code === 'unavailable') throw new Error("DB_OFFLINE");
        throw dbErr;
      }
    } catch (error: any) {
      if (error.message === 'DB_OFFLINE') throw error;
      handleFirestoreError(error, OperationType.CREATE, 'attendance');
      throw error;
    }
  },

  async punchOut(attendanceId: string, userId: string, durationMinutes: number): Promise<void> {
    try {
      // Robust GPS Sync (faster for punch out)
      const { lat, lng, name: locationName } = await getRobustLocation(4000);

      const attendanceRef = doc(db, 'attendance', attendanceId);
      await updateDoc(attendanceRef, {
        punchOut: serverTimestamp(),
        punchOutLocation: { lat, lng },
        punchOutLocationName: locationName,
        status: 'completed' as const,
        durationMinutes
      });

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
