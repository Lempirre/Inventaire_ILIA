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
import { supabase } from "@/supabaseConfig";

// Type pour les données brutes retournées par Supabase
type SupabaseLocationData = {
  id: string;
  date_location: string;
  date_remise: string;
  id_emprunteur: string;
  id_preteur: string;
  id_materiel: string;
  // Supabase retourne les relations comme des tableaux
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
  }[];
};

// Type pour les données transformées utilisées dans le composant
type LocationWithDetails = {
  id: string;
  date_location: string;
  date_remise: string;
  id_emprunteur: string;
  id_preteur: string;
  id_materiel: string;
  // Objets uniques après transformation
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
  };
};

// Type pour le matériel
type Materiel = {
  id: string;
  nom: string;
};

// Type pour les utilisateurs
type Utilisateur = {
  id: string;
  nom: string;
  email?: string;
  est_preteur: boolean;
};

// Type pour le formulaire
type FormData = {
  preteurId: string;
  nomEmprunteur: string;
  emailEmprunteur: string;
  materielId: string;
  datePret: string;
  dateRemise: string;
};

const LocationScreen = () => {
  const [locations, setLocations] = useState<LocationWithDetails[]>([]);
  const [materiel, setMateriels] = useState<Materiel[]>([]);
  const [preteurs, setPreteurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showMaterielPicker, setShowMaterielPicker] = useState(false);
  const [showPreteurPicker, setShowPreteurPicker] = useState(false);

  // État du formulaire
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
      // Requête avec jointures pour récupérer toutes les données liées
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
            nom
          )
        `);

      console.log("Données récupérées:", data);

      if (error) {
        console.error("Erreur Supabase :", error);
        return;
      }

      // Transformation des données : conversion des tableaux en objets uniques
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
        .select("id, nom")
        .order("nom");

      if (error) {
        console.error("Erreur lors de la récupération des matériels :", error);
        return;
      }

      setMateriels(data || []);
    } catch (error) {
      console.error("Erreur lors de la récupération des matériels :", error);
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
      Alert.alert("Erreur", "Veuillez sélectionner un matériel");
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

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.emailEmprunteur)) {
      Alert.alert("Erreur", "L'email n'est pas valide");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      console.log("Début de la soumission avec les données:", formData);

      // 1. Le prêteur est déjà sélectionné par son ID
      const preteurId = formData.preteurId;

      // 2. Créer ou récupérer l'emprunteur (avec est_preteur = false)
      let { data: emprunteur, error: emprunteurError } = await supabase
        .from("utilisateur")
        .select("id")
        .eq("nom", formData.nomEmprunteur)
        .eq("email", formData.emailEmprunteur)
        .maybeSingle(); // Utiliser maybeSingle() au lieu de single()

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
                est_preteur: false, // L'emprunteur n'est pas un prêteur
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

      // 3. Le matériel est déjà sélectionné par son ID
      const materielId = formData.materielId;

      console.log("Données pour la location:", {
        id_preteur: preteurId,
        id_emprunteur: emprunteur.id,
        id_materiel: materielId,
        date_location: formData.datePret,
        date_remise: formData.dateRemise,
      });

      // 4. Créer la location
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
        throw locationError;
      }

      // Succès
      Alert.alert("Succès", "Location créée avec succès");

      // Réinitialiser le formulaire
      setFormData({
        preteurId: "",
        nomEmprunteur: "",
        emailEmprunteur: "",
        materielId: "",
        datePret: "",
        dateRemise: "",
      });

      setShowForm(false);

      // Recharger les données
      await fetchLocations();
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

  const renderItem = ({ item }: { item: LocationWithDetails }) => (
    <View style={styles.card}>
      <Text style={styles.name}>
        Matériel : {item.materiel?.nom || "Non défini"}
      </Text>
      <Text>Emprunteur : {item.locataire?.nom || "Non défini"}</Text>
      <Text>Email emprunteur : {item.locataire?.email || "Non défini"}</Text>
      <Text>Date de prêt : {item.date_location}</Text>
      <Text>Date de remise : {item.date_remise}</Text>
      <Text>Prêteur : {item.loueur?.nom || "Non défini"}</Text>
      {/* Debug - à supprimer une fois que ça marche */}
      <Text style={styles.debugText}>
        Debug - IDs: Prêteur: {item.id_preteur}, Emprunteur:{" "}
        {item.id_emprunteur}, Matériel: {item.id_materiel}
      </Text>
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
      return "Sélectionner un matériel";
    }
    const selected = materiel.find((m) => m.id === formData.materielId);
    return selected ? selected.nom : "Matériel inconnu";
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

      {/* Bouton pour afficher/masquer le formulaire */}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setShowForm(!showForm)}
      >
        <Text style={styles.toggleButtonText}>
          {showForm ? "Masquer le formulaire" : "Ajouter une location"}
        </Text>
      </TouchableOpacity>

      {/* Formulaire */}
      {showForm && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Nouvelle Location</Text>

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

      {/* Modal pour sélectionner le prêteur */}
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

      {/* Modal pour sélectionner le matériel */}
      <Modal
        visible={showMaterielPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMaterielPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner un matériel</Text>
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
                  ]}
                  onPress={() => handleMaterielSelect(materiel.id)}
                >
                  <Text
                    style={[
                      styles.materielOptionText,
                      formData.materielId === materiel.id &&
                        styles.materielOptionTextSelected,
                    ]}
                  >
                    {materiel.nom}
                  </Text>
                </TouchableOpacity>
              ))}

              {materiel.length === 0 && (
                <Text style={styles.emptyText}>Aucun matériel disponible</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Liste des locations */}
      <Text style={styles.subtitle}>Locations en cours</Text>
      <FlatList
        data={locations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        scrollEnabled={false}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  toggleButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  toggleButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
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
  materielOptionText: {
    fontSize: 16,
    color: "#333",
  },
  materielOptionTextSelected: {
    color: "#2196F3",
    fontWeight: "bold",
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
  debugText: {
    fontSize: 10,
    color: "#666",
    fontStyle: "italic",
    marginTop: 5,
  },
});

export default LocationScreen;
