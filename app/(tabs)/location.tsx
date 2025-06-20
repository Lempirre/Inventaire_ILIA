import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { firebaseApp } from "@/firebaseConfig"; // ← à adapter selon ton fichier de config

const db = getFirestore(firebaseApp);

type Location = {
  id: string;
  locataire: string;
  datePret: string;
  dateRemise: string;
  loueur: string;
};

const LocationScreen = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const snapshot = await getDocs(collection(db, "locations"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Location[];
        setLocations(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des locations :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const renderItem = ({ item }: { item: Location }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.locataire}</Text>
      <Text>Date de prêt : {item.datePret}</Text>
      <Text>Date de remise : {item.dateRemise}</Text>
      <Text>Loué par : {item.loueur}</Text>
    </View>
  );

  if (loading)
    return <ActivityIndicator size="large" style={{ marginTop: 20 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Locations en cours</Text>
      <FlatList
        data={locations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  card: {
    backgroundColor: "#e0f7fa",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  name: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
});

export default LocationScreen;
