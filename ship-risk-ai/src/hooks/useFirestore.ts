import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
  collection,
  query,
  onSnapshot,
  type DocumentData,
} from "firebase/firestore";
import type { QueryConstraint } from "firebase/firestore";

export const useFirestore = <T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    try {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, ...constraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: T[] = [];
          snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() } as T);
          });
          setData(items);
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        },
      );

      return () => unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  }, [collectionName, constraints]);

  return { data, loading, error };
};
