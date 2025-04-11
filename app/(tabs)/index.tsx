import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import { router } from "expo-router";

import LocationScreen from "@/app/(tabs)/location";

type Fiche = {
  id: number;
  composants: string[];
};

const IndexScreen = () => {
  const navigation = useNavigation();

  const [fiches, setFiches] = useState([
    { id: 1, composants: ["Composant A", "Composant B"] },
  ]);

  const ajouterFiche = () => {
    const newId = fiches.length ? fiches[fiches.length - 1].id + 1 : 1;
    setFiches([...fiches, { id: newId, composants: [] }]);
  };

  const supprimerFiche = (id: number) => {
    setFiches(fiches.filter((fiche) => fiche.id !== id));
  };

  const ajouterComposant = (ficheId: number) => {
    setFiches(
      fiches.map((fiche) => {
        if (fiche.id === ficheId) {
          return {
            ...fiche,
            composants: [
              ...fiche.composants,
              `Composant ${fiche.composants.length + 1}`,
            ],
          };
        }
        return fiche;
      })
    );
  };

  const supprimerComposant = (ficheId: number) => {
    setFiches(
      fiches.map((fiche) => {
        if (fiche.id === ficheId && fiche.composants.length > 0) {
          return {
            ...fiche,
            composants: fiche.composants.slice(0, -1),
          };
        }
        return fiche;
      })
    );
  };

  const renderFiche = ({ item }: { item: Fiche }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Fiche #{item.id}</Text>
      {item.composants.map((c, idx) => (
        <Text key={idx} style={styles.componentText}>
          {c}
        </Text>
      ))}
      <View style={styles.buttonRow}>
        <Button
          title="Ajouter composant"
          onPress={() => ajouterComposant(item.id)}
        />
        <Button
          title="Supprimer composant"
          onPress={() => supprimerComposant(item.id)}
        />
      </View>
      <Button
        color="red"
        title="Supprimer fiche"
        onPress={() => supprimerFiche(item.id)}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fiches d'identité des composants</Text>
      <FlatList
        data={fiches}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFiche}
      />
      <View style={styles.bottomButtons}>
        <Button title="Ajouter une fiche" onPress={ajouterFiche} />
        <TouchableOpacity
          style={styles.rentButton}
          onPress={() => router.push("/location")}
        >
          <Text style={styles.rentButtonText}>→ Aller à la location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  card: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 18, fontWeight: "600", marginBottom: 5 },
  componentText: { fontSize: 16, marginLeft: 10 },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  bottomButtons: { marginTop: 20 },
  rentButton: {
    marginTop: 10,
    backgroundColor: "#4a90e2",
    padding: 12,
    borderRadius: 8,
  },
  rentButtonText: { color: "white", textAlign: "center", fontWeight: "bold" },
});

export default IndexScreen;
