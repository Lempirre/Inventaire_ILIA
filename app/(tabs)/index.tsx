import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/supabaseConfig";

type Materiel = {
  id: number;
  nom: string;
  nombre: number;
  created_at?: string;
};

export default function IndexScreen() {
  const router = useRouter();
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [loading, setLoading] = useState(true);
  const [nomMateriel, setNomMateriel] = useState("");
  const [nombreMateriel, setNombreMateriel] = useState("");

  const chargerMateriels = async () => {
    try {
      const { data, error } = await supabase
        .from("materiel")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.error("Erreur lors du chargement:", error);
        Alert.alert("Erreur", "Impossible de charger les composants");
        return;
      }

      setMateriels(data || []);
    } catch (error) {
      console.error("Erreur:", error);
      Alert.alert("Erreur", "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const ajouterMateriel = async () => {
    if (!nomMateriel.trim() || !nombreMateriel.trim()) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    const nombre = parseInt(nombreMateriel);
    if (isNaN(nombre) || nombre < 0) {
      Alert.alert("Erreur", "Le nombre doit être un entier positif");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("materiel")
        .insert([{ nom: nomMateriel.trim(), nombre: nombre }])
        .select();

      if (error) {
        console.error("Erreur lors de l'ajout:", error);
        Alert.alert("Erreur", "Impossible d'ajouter le composant");
        return;
      }

      if (data && data.length > 0) {
        setMateriels([...materiels, data[0]]);
        setNomMateriel("");
        setNombreMateriel("");
        Alert.alert("Succès", "Matériel ajouté avec succès");
      }
    } catch (error) {
      console.error("Erreur:", error);
      Alert.alert("Erreur", "Une erreur est survenue");
    }
  };

  const supprimerMateriel = async (id: number) => {
    try {
      const { error } = await supabase.from("materiel").delete().eq("id", id);

      if (error) {
        console.error("Erreur lors de la suppression:", error);
        Alert.alert("Erreur", "Impossible de supprimer le composant");
        return;
      }

      setMateriels(materiels.filter((materiel) => materiel.id !== id));
      Alert.alert("Succès", "Matériel supprimé avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      Alert.alert("Erreur", "Une erreur est survenue");
    }
  };

  const modifierNombre = async (id: number, nouveauNombre: number) => {
    if (nouveauNombre < 0) return;

    try {
      const { error } = await supabase
        .from("materiel")
        .update({ nombre: nouveauNombre })
        .eq("id", id);

      if (error) {
        console.error("Erreur lors de la mise à jour:", error);
        Alert.alert("Erreur", "Impossible de mettre à jour le composant");
        return;
      }

      setMateriels(
        materiels.map((materiel) =>
          materiel.id === id ? { ...materiel, nombre: nouveauNombre } : materiel
        )
      );
    } catch (error) {
      console.error("Erreur:", error);
      Alert.alert("Erreur", "Une erreur est survenue");
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    chargerMateriels();
  }, []);

  const renderMateriel = ({ item }: { item: Materiel }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.nom}</Text>
        <View
          style={[
            styles.statusIndicator,
            item.nombre > 0 ? styles.available : styles.unavailable,
          ]}
        >
          <Text style={styles.statusText}>
            {item.nombre > 0 ? "En stock" : "Épuisé"}
          </Text>
        </View>
      </View>

      <View style={styles.quantitySection}>
        <Text style={styles.quantityLabel}>Quantité disponible</Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.decrementButton]}
            onPress={() => modifierNombre(item.id, item.nombre - 1)}
            activeOpacity={0.7}
          >
            <Text style={styles.controlButtonText}>-</Text>
          </TouchableOpacity>

          <View style={styles.quantityDisplay}>
            <Text style={styles.quantityNumber}>{item.nombre}</Text>
          </View>

          <TouchableOpacity
            style={[styles.controlButton, styles.incrementButton]}
            onPress={() => modifierNombre(item.id, item.nombre + 1)}
            activeOpacity={0.7}
          >
            <Text style={styles.controlButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          Alert.alert(
            "Confirmation",
            "Êtes-vous sûr de vouloir supprimer ce composant ?",
            [
              { text: "Annuler", style: "cancel" },
              { text: "Supprimer", onPress: () => supprimerMateriel(item.id) },
            ]
          );
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.deleteButtonText}>Supprimer</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <Text style={styles.title}>Gestion du matériel</Text>
        <Text style={styles.subtitle}>{materiels.length} articles</Text>
      </View>

      <FlatList
        data={materiels}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMateriel}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={true}
        style={styles.materialsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucun composant enregistré</Text>
          </View>
        }
        ListFooterComponent={
          <View>
            <View style={styles.addForm}>
              <Text style={styles.formTitle}>Ajouter un article</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom du composant</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Saisissez le nom"
                  value={nomMateriel}
                  onChangeText={setNomMateriel}
                  placeholderTextColor="#6b7280"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Quantité</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  value={nombreMateriel}
                  onChangeText={setNombreMateriel}
                  keyboardType="numeric"
                  placeholderTextColor="#6b7280"
                />
              </View>

              <TouchableOpacity
                style={styles.addButton}
                onPress={ajouterMateriel}
                activeOpacity={0.8}
              >
                <Text style={styles.addButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.locationButton}
              onPress={() => router.push("/location")}
              activeOpacity={0.8}
            >
              <Text style={styles.locationButtonText}>Gérer les locations</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  materialsList: {
    flex: 1,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#111827",
    flex: 1,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
  },
  available: {
    backgroundColor: "#dcfce7",
  },
  unavailable: {
    backgroundColor: "#fee2e2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
  },
  quantitySection: {
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 12,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  decrementButton: {
    backgroundColor: "#ffffff",
    borderColor: "#d1d5db",
  },
  incrementButton: {
    backgroundColor: "#ffffff",
    borderColor: "#d1d5db",
  },
  controlButtonText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#374151",
  },
  quantityDisplay: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 12,
    minWidth: 60,
  },
  quantityNumber: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    textAlign: "center",
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#fef2f2",
  },
  deleteButtonText: {
    color: "#dc2626",
    textAlign: "center",
    fontWeight: "500",
    fontSize: 14,
  },
  addForm: {
    backgroundColor: "#ffffff",
    margin: 16,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 16,
    color: "#111827",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#111827",
  },
  addButton: {
    backgroundColor: "#2563eb",
    borderRadius: 4,
    paddingVertical: 12,
    marginTop: 4,
  },
  addButtonText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "500",
    fontSize: 16,
  },
  locationButton: {
    backgroundColor: "#059669",
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 4,
    paddingVertical: 14,
  },
  locationButtonText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "500",
    fontSize: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
});
