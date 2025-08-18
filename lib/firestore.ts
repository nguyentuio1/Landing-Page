import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  orderBy,
  doc,
  getDoc,
  setDoc,
  increment
} from 'firebase/firestore';
import { db } from './firebase';

// Collection references
const emailsCollection = collection(db, 'emails');
const countersCollection = collection(db, 'counters');

export interface EmailEntry {
  email: string;
  timestamp: Date;
}

// Initialize counter if it doesn't exist
export async function initializeCounter() {
  const counterDoc = doc(countersCollection, 'emailCount');
  const counterSnap = await getDoc(counterDoc);
  
  if (!counterSnap.exists()) {
    await setDoc(counterDoc, {
      count: 1247, // Starting count for social proof
      lastUpdated: new Date()
    });
  }
}

// Add email to Firestore
export async function addEmailToFirestore(email: string): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Check if email already exists
    const emailQuery = query(emailsCollection, where('email', '==', email));
    const existingEmails = await getDocs(emailQuery);
    
    if (!existingEmails.empty) {
      return { success: false, count: 0, error: 'Email already registered' };
    }
    
    // Add new email
    await addDoc(emailsCollection, {
      email,
      timestamp: new Date()
    });
    
    // Increment counter
    const counterDoc = doc(countersCollection, 'emailCount');
    await setDoc(counterDoc, {
      count: increment(1),
      lastUpdated: new Date()
    }, { merge: true });
    
    // Get updated count
    const updatedCounter = await getDoc(counterDoc);
    const newCount = updatedCounter.data()?.count || 0;
    
    return { success: true, count: newCount };
    
  } catch (error) {
    console.error('Error adding email to Firestore:', error);
    return { success: false, count: 0, error: 'Failed to add email' };
  }
}

// Get current email count
export async function getEmailCount(): Promise<number> {
  try {
    await initializeCounter();
    const counterDoc = doc(countersCollection, 'emailCount');
    const counterSnap = await getDoc(counterDoc);
    
    return counterSnap.data()?.count || 1247;
  } catch (error) {
    console.error('Error getting email count:', error);
    return 1247;
  }
}

// Subscribe to real-time count updates
export function subscribeToEmailCount(callback: (count: number) => void): () => void {
  const counterDoc = doc(countersCollection, 'emailCount');
  
  return onSnapshot(counterDoc, (doc) => {
    const count = doc.data()?.count || 1247;
    callback(count);
  }, (error) => {
    console.error('Error listening to count updates:', error);
    callback(1247);
  });
}

// Get all emails (for admin purposes)
export async function getAllEmails(): Promise<EmailEntry[]> {
  try {
    const emailQuery = query(emailsCollection, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(emailQuery);
    
    return querySnapshot.docs.map(doc => ({
      email: doc.data().email,
      timestamp: doc.data().timestamp.toDate()
    }));
  } catch (error) {
    console.error('Error getting all emails:', error);
    return [];
  }
}