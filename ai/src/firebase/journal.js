// src/firebase/journal.js
import { doc, setDoc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { auth, db } from './init';

export const saveJournalEntry = async (entry) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    // Create a unique ID for the entry if not provided
    const entryId = entry.id || new Date().getTime().toString();
    
    // Add timestamps and user ID
    const enrichedEntry = {
      ...entry,
      id: entryId,
      userId: user.uid,
      updatedAt: new Date().toISOString(),
      createdAt: entry.createdAt || new Date().toISOString()
    };
    
    // Save to Firestore
    await setDoc(doc(db, "journalEntries", entryId), enrichedEntry);
    
    return entryId;
  } catch (error) {
    console.error('Error saving journal entry:', error);
    throw error;
  }
};

export const getJournalEntries = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    // Query entries for the current user, ordered by creation date
    const entriesRef = collection(db, "journalEntries");
    const q = query(
      entriesRef, 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const entries = [];
    
    querySnapshot.forEach((doc) => {
      entries.push({ id: doc.id, ...doc.data() });
    });
    
    return entries;
  } catch (error) {
    console.error('Error getting journal entries:', error);
    throw error;
  }
};

export const getJournalEntry = async (entryId) => {
  try {
    const entryRef = doc(db, "journalEntries", entryId);
    const entrySnap = await getDoc(entryRef);
    
    if (entrySnap.exists()) {
      return { id: entrySnap.id, ...entrySnap.data() };
    } else {
      throw new Error('Entry not found');
    }
  } catch (error) {
    console.error('Error getting journal entry:', error);
    throw error;
  }
};