import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/supabaseConfig";

type SupabaseLocationData = {
  id: string;
  date_location: string;
  date_remise: string;
  id_emprunteur: string;
  id_preteur: string;
  id_materiel: string;

  locataire: {
    id: string;
    nom: string;
    email?: string;
    est_preteur: boolean;
  }[];
  loueur: {
    id: string;
    nom: string;
    email?: string;
    est_preteur: boolean;
  }[];
  materiel: {
    id: string;
    nom: string;
    nombre?: number;
  }[];
};

type LocationWithDetails = {
  id: string;
  date_location: string;
  date_remise: string;
  id_emprunteur: string;
  id_preteur: string;
  id_materiel: string;

  locataire: {
    id: string;
    nom: string;
    email?: string;
    est_preteur: boolean;
  };
  loueur: {
    id: string;
    nom: string;
    email?: string;
    est_preteur: boolean;
  };
  materiel: {
    id: string;
    nom: string;
    nombre?: number;
  };
};

type Materiel = {
  id: string;
  nom: string;
  nombre: number;
};

type Utilisateur = {
  id: string;
  nom: string;
  email?: string;
  est_preteur: boolean;
};

type FormData = {
  preteurId: string;
  nomEmprunteur: string;
  emailEmprunteur: string;
  materielId: string;
  datePret: string;
  dateRemise: string;
};

const LocationScreen = () => {
  const router = useRouter();
  const [locations, setLocations] = useState<LocationWithDetails[]>([]);
  const [materiel, setMateriels] = useState<Materiel[]>([]);
  const [preteurs, setPreteurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showMaterielPicker, setShowMaterielPicker] = useState(false);
  const [showPreteurPicker, setShowPreteurPicker] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    preteurId: "",
    nomEmprunteur: "",
    emailEmprunteur: "",
    materielId: "",
    datePret: "",
    dateRemise: "",
  });

  useEffect(() => {
    fetchLocations();
    fetchMateriels();
    fetchPreteurs();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase.from("location").select(`
          id,
          date_location,
          date_remise,
          id_emprunteur,
          id_preteur,
          id_materiel,
          locataire:utilisateur!location_id_emprunteur_fkey (
            id,
            nom,
            email,
            est_preteur
          ),
          loueur:utilisateur!location_id_preteur_fkey (
            id,
            nom, 
            email,
            est_preteur
          ),
          materiel:materiel!location_id_materiel_fkey (
            id,
            nom,
            nombre
          )
        `);

      console.log("Données récupérées:", data);

      if (error) {
        console.error("Erreur Supabase :", error);
        return;
      }

      const transformedData: LocationWithDetails[] = (
        (data as SupabaseLocationData[]) || []
      ).map((item) => {
        console.log("Item avant transformation:", item);
        const transformed = {
          ...item,
          locataire: Array.isArray(item.locataire)
            ? item.locataire[0]
            : item.locataire,
          loueur: Array.isArray(item.loueur) ? item.loueur[0] : item.loueur,
          materiel: Array.isArray(item.materiel)
            ? item.materiel[0]
            : item.materiel,
        };
        console.log("Item après transformation:", transformed);
        return transformed;
      });

      console.log("Données transformées:", transformedData);
      setLocations(transformedData);
    } catch (error) {
      console.error("Erreur lors de la récupération des locations :", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMateriels = async () => {
    try {
      const { data, error } = await supabase
        .from("materiel")
        .select("id, nom, nombre")
        .order("nom");

      if (error) {
        console.error("Erreur lors de la récupération des composants :", error);
        return;
      }

      setMateriels(data || []);
    } catch (error) {
      console.error("Erreur lors de la récupération des composants :", error);
    }
  };

  const fetchPreteurs = async () => {
    try {
      const { data, error } = await supabase
        .from("utilisateur")
        .select("id, nom, email, est_preteur")
        .eq("est_preteur", true)
        .order("nom");

      if (error) {
        console.error("Erreur lors de la récupération des prêteurs :", error);
        return;
      }

      setPreteurs(data || []);
    } catch (error) {
      console.error("Erreur lors de la récupération des prêteurs :", error);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.preteurId.trim()) {
      Alert.alert("Erreur", "Veuillez sélectionner un prêteur");
      return false;
    }
    if (!formData.nomEmprunteur.trim()) {
      Alert.alert("Erreur", "Le nom de l'emprunteur est requis");
      return false;
    }
    if (!formData.emailEmprunteur.trim()) {
      Alert.alert("Erreur", "L'email de l'emprunteur est requis");
      return false;
    }
    if (!formData.materielId.trim()) {
      Alert.alert("Erreur", "Veuillez sélectionner un composant");
      return false;
    }
    if (!formData.datePret.trim()) {
      Alert.alert("Erreur", "La date de prêt est requise");
      return false;
    }
    if (!formData.dateRemise.trim()) {
      Alert.alert("Erreur", "La date de remise est requise");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.emailEmprunteur)) {
      Alert.alert("Erreur", "L'email n'est pas valide");
      return false;
    }

    const selectedMateriel = materiel.find((m) => m.id === formData.materielId);
    if (selectedMateriel && selectedMateriel.nombre <= 0) {
      Alert.alert("Erreur", "Ce composant n'est plus disponible");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      console.log("Début de la soumission avec les données:", formData);

      const preteurId = formData.preteurId;

      let { data: emprunteur, error: emprunteurError } = await supabase
        .from("utilisateur")
        .select("id")
        .eq("nom", formData.nomEmprunteur)
        .eq("email", formData.emailEmprunteur)
        .maybeSingle();

      console.log("Recherche emprunteur:", { emprunteur, emprunteurError });

      if (emprunteurError) {
        console.error(
          "Erreur lors de la recherche de l'emprunteur:",
          emprunteurError
        );
        throw emprunteurError;
      }

      if (!emprunteur) {
        console.log("Création d'un nouvel emprunteur");
        const { data: newEmprunteur, error: newEmprunteurError } =
          await supabase
            .from("utilisateur")
            .insert([
              {
                nom: formData.nomEmprunteur,
                email: formData.emailEmprunteur,
                est_preteur: false,
              },
            ])
            .select("id")
            .single();

        console.log("Nouvel emprunteur:", {
          newEmprunteur,
          newEmprunteurError,
        });

        if (newEmprunteurError) {
          console.error(
            "Erreur lors de la création de l'emprunteur:",
            newEmprunteurError
          );
          throw newEmprunteurError;
        }
        emprunteur = newEmprunteur;
      }

      const materielId = formData.materielId;

      const { data: currentMateriel, error: materielFetchError } =
        await supabase
          .from("materiel")
          .select("nombre")
          .eq("id", materielId)
          .single();

      if (materielFetchError) {
        console.error(
          "Erreur lors de la récupération du composant :",
          materielFetchError
        );
        throw materielFetchError;
      }

      if (currentMateriel.nombre <= 0) {
        Alert.alert("Erreur", "Ce composant n'est plus disponible");
        return;
      }

      const { error: materielUpdateError } = await supabase
        .from("materiel")
        .update({ nombre: currentMateriel.nombre - 1 })
        .eq("id", materielId);

      if (materielUpdateError) {
        console.error(
          "Erreur lors de la mise à jour du composant :",
          materielUpdateError
        );
        throw materielUpdateError;
      }

      console.log("Données pour la location:", {
        id_preteur: preteurId,
        id_emprunteur: emprunteur.id,
        id_materiel: materielId,
        date_location: formData.datePret,
        date_remise: formData.dateRemise,
      });

      const { data: locationData, error: locationError } = await supabase
        .from("location")
        .insert([
          {
            id_preteur: preteurId,
            id_emprunteur: emprunteur.id,
            id_materiel: materielId,
            date_location: formData.datePret,
            date_remise: formData.dateRemise,
          },
        ])
        .select();

      console.log("Résultat création location:", {
        locationData,
        locationError,
      });

      if (locationError) {
        console.error(
          "Erreur lors de la création de la location:",
          locationError
        );

        await supabase
          .from("materiel")
          .update({ nombre: currentMateriel.nombre })
          .eq("id", materielId);
        throw locationError;
      }

      Alert.alert("Succès", "Location créée avec succès");

      setFormData({
        preteurId: "",
        nomEmprunteur: "",
        emailEmprunteur: "",
        materielId: "",
        datePret: "",
        dateRemise: "",
      });

      setShowForm(false);

      await fetchLocations();
      await fetchMateriels();
    } catch (error) {
      console.error("Erreur lors de la création de la location :", error);
      Alert.alert(
        "Erreur",
        `Une erreur est survenue lors de la création de la location: ${
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message: string }).message
            : String(error)
        }`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLocation = async (
    locationId: string,
    materielId: string
  ) => {
    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer cette location ? Le composant sera remis en stock.",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => deleteLocation(locationId, materielId),
        },
      ]
    );
  };

  const deleteLocation = async (locationId: string, materielId: string) => {
    console.log("locationId:", locationId, "materielId:", materielId);

    if (!locationId || !materielId) {
      Alert.alert("Erreur", "ID de location ou composant manquant");
      return;
    }
    setDeleting(locationId);

    try {
      console.log("Début de la suppression de la location:", locationId);
      console.log("Matériel ID:", materielId);

      if (!locationId || !materielId) {
        throw new Error("ID de location ou composant manquant");
      }

      const { data: locationExists, error: locationCheckError } = await supabase
        .from("location")
        .select("id")
        .eq("id", locationId)
        .single();

      if (locationCheckError || !locationExists) {
        throw new Error("Location non trouvée");
      }

      const { data: currentMateriel, error: materielFetchError } =
        await supabase
          .from("materiel")
          .select("nombre")
          .eq("id", materielId)
          .single();

      if (materielFetchError || !currentMateriel) {
        console.error(
          "Erreur lors de la récupération du composant:",
          materielFetchError
        );
        throw new Error("Matériel non trouvé");
      }

      const { error: locationDeleteError } = await supabase
        .from("location")
        .delete()
        .eq("id", locationId);

      if (locationDeleteError) {
        console.error(
          "Erreur lors de la suppression de la location:",
          locationDeleteError
        );
        throw locationDeleteError;
      }

      const { error: materielUpdateError } = await supabase
        .from("materiel")
        .update({ nombre: currentMateriel.nombre + 1 })
        .eq("id", materielId);

      if (materielUpdateError) {
        console.error(
          "Erreur lors de la mise à jour du composant:",
          materielUpdateError
        );
        throw materielUpdateError;
      }

      console.log("Location supprimée avec succès");
      Alert.alert(
        "Succès",
        "Location supprimée avec succès. Le composant a été remis en stock."
      );

      await fetchLocations();
      await fetchMateriels();
    } catch (error) {
      console.error("Erreur lors de la suppression de la location:", error);
      Alert.alert(
        "Erreur",
        `Une erreur est survenue: ${
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message: string }).message
            : String(error)
        }`
      );
    } finally {
      setDeleting(null);
    }
  };

  const renderItem = ({ item }: { item: LocationWithDetails }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        Matériel : {item.materiel?.nom || "Non défini"}
      </Text>
      <Text style={styles.cardText}>
        Emprunteur : {item.locataire?.nom || "Non défini"}
      </Text>
      <Text style={styles.cardText}>
        Email : {item.locataire?.email || "Non défini"}
      </Text>
      <Text style={styles.cardText}>Date de prêt : {item.date_location}</Text>
      <Text style={styles.cardText}>Date de remise : {item.date_remise}</Text>
      <Text style={styles.cardText}>
        Prêteur : {item.loueur?.nom || "Non défini"}
      </Text>

      <TouchableOpacity
        style={[
          styles.deleteButton,
          deleting === item.id && styles.deleteButtonDisabled,
        ]}
        onPress={() => handleDeleteLocation(item.id, item.id_materiel)}
        disabled={deleting === item.id}
      >
        <Text style={styles.deleteButtonText}>
          {deleting === item.id ? "Suppression..." : "Supprimer"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading)
    return <ActivityIndicator size="large" style={{ marginTop: 20 }} />;

  function handleMaterielSelect(id: string): void {
    setFormData((prev) => ({
      ...prev,
      materielId: id,
    }));
    setShowMaterielPicker(false);
  }

  function handlePreteurSelect(id: string): void {
    setFormData((prev) => ({
      ...prev,
      preteurId: id,
    }));
    setShowPreteurPicker(false);
  }

  function getSelectedMaterielName(): React.ReactNode {
    if (!formData.materielId) {
      return "Sélectionner un composant";
    }
    const selected = materiel.find((m) => m.id === formData.materielId);
    return selected
      ? `${selected.nom} (${selected.nombre} disponible${
          selected.nombre > 1 ? "s" : ""
        })`
      : "Matériel inconnu";
  }

  function getSelectedPreteurName(): React.ReactNode {
    if (!formData.preteurId) {
      return "Sélectionner un prêteur";
    }
    const selected = preteurs.find((p) => p.id === formData.preteurId);
    return selected ? selected.nom : "Prêteur inconnu";
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Locations</Text>

      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setShowForm(!showForm)}
      >
        <Text style={styles.toggleButtonText}>
          {showForm ? "Masquer le formulaire" : "Ajouter une location"}
        </Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Nouvelle location</Text>

          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowPreteurPicker(true)}
          >
            <Text
              style={[
                styles.pickerButtonText,
                formData.preteurId
                  ? styles.pickerButtonTextSelected
                  : styles.pickerButtonTextPlaceholder,
              ]}
            >
              {getSelectedPreteurName()}
            </Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Nom de l'emprunteur"
            value={formData.nomEmprunteur}
            onChangeText={(text) => handleInputChange("nomEmprunteur", text)}
          />

          <TextInput
            style={styles.input}
            placeholder="Email de l'emprunteur"
            value={formData.emailEmprunteur}
            onChangeText={(text) => handleInputChange("emailEmprunteur", text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowMaterielPicker(true)}
          >
            <Text
              style={[
                styles.pickerButtonText,
                formData.materielId
                  ? styles.pickerButtonTextSelected
                  : styles.pickerButtonTextPlaceholder,
              ]}
            >
              {getSelectedMaterielName()}
            </Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Date de prêt (YYYY-MM-DD)"
            value={formData.datePret}
            onChangeText={(text) => handleInputChange("datePret", text)}
          />

          <TextInput
            style={styles.input}
            placeholder="Date de remise (YYYY-MM-DD)"
            value={formData.dateRemise}
            onChangeText={(text) => handleInputChange("dateRemise", text)}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              submitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? "Envoi en cours..." : "Envoyer"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showPreteurPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPreteurPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner un prêteur</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPreteurPicker(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {preteurs.map((preteur) => (
                <TouchableOpacity
                  key={preteur.id}
                  style={[
                    styles.materielOption,
                    formData.preteurId === preteur.id &&
                      styles.materielOptionSelected,
                  ]}
                  onPress={() => handlePreteurSelect(preteur.id)}
                >
                  <Text
                    style={[
                      styles.materielOptionText,
                      formData.preteurId === preteur.id &&
                        styles.materielOptionTextSelected,
                    ]}
                  >
                    {preteur.nom}
                    {preteur.email && (
                      <Text style={styles.emailText}> ({preteur.email})</Text>
                    )}
                  </Text>
                </TouchableOpacity>
              ))}

              {preteurs.length === 0 && (
                <Text style={styles.emptyText}>Aucun prêteur disponible</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showMaterielPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMaterielPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner un composant</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowMaterielPicker(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {materiel.map((materiel) => (
                <TouchableOpacity
                  key={materiel.id}
                  style={[
                    styles.materielOption,
                    formData.materielId === materiel.id &&
                      styles.materielOptionSelected,
                    materiel.nombre <= 0 && styles.materielOptionDisabled,
                  ]}
                  onPress={() =>
                    materiel.nombre > 0 && handleMaterielSelect(materiel.id)
                  }
                  disabled={materiel.nombre <= 0}
                >
                  <Text
                    style={[
                      styles.materielOptionText,
                      formData.materielId === materiel.id &&
                        styles.materielOptionTextSelected,
                      materiel.nombre <= 0 && styles.materielOptionTextDisabled,
                    ]}
                  >
                    {materiel.nom} ({materiel.nombre} disponible
                    {materiel.nombre > 1 ? "s" : ""})
                    {materiel.nombre <= 0 && " - Indisponible"}
                  </Text>
                </TouchableOpacity>
              ))}

              {materiel.length === 0 && (
                <Text style={styles.emptyText}>Aucun composant disponible</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Text style={styles.subtitle}>Locations en cours</Text>
      <FlatList
        data={locations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        scrollEnabled={false}
      />
      <TouchableOpacity
        style={styles.locationButton}
        onPress={() => router.push("/")}
        activeOpacity={0.8}
      >
        <Text style={styles.locationButtonText}>Gérer l'inventaire</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    marginTop: 20,
  },
  card: {
    backgroundColor: "#e0f7fa",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e3e3e3",
    boxShadow: "0px 1px 2px rgba(0,0,0,0.3)",
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#1a1a1a",
  },
  cardText: {
    fontSize: 14,
    color: "#444",
    marginBottom: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  toggleButton: {
    backgroundColor: "#2563eb",
    borderRadius: 4,
    paddingVertical: 12,
    marginTop: 4,
    alignItems: "center",
    marginBottom: 20,
  },
  toggleButtonText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "500",
    fontSize: 16,
  },
  formContainer: {
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  pickerButton: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerButtonText: {
    fontSize: 16,
    flex: 1,
  },
  pickerButtonTextSelected: {
    color: "#000",
  },
  pickerButtonTextPlaceholder: {
    color: "#999",
  },
  pickerArrow: {
    color: "#666",
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    width: "90%",
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalCloseButton: {
    padding: 5,
  },
  modalCloseText: {
    fontSize: 20,
    color: "#666",
  },
  modalScrollView: {
    maxHeight: 300,
  },
  materielOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  materielOptionSelected: {
    backgroundColor: "#e3f2fd",
  },
  materielOptionDisabled: {
    backgroundColor: "#f5f5f5",
    opacity: 0.6,
  },
  materielOptionText: {
    fontSize: 16,
    color: "#333",
  },
  materielOptionTextSelected: {
    color: "#2196F3",
    fontWeight: "bold",
  },
  materielOptionTextDisabled: {
    color: "#999",
  },
  emailText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "normal",
  },
  emptyText: {
    textAlign: "center",
    padding: 20,
    color: "#666",
    fontStyle: "italic",
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
  debugText: {
    fontSize: 10,
    color: "#666",
    fontStyle: "italic",
    marginTop: 5,
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  deleteButtonDisabled: {
    backgroundColor: "#fca5a5",
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default LocationScreen;
