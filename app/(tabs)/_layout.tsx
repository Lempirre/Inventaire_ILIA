import { Stack } from "expo-router";
import { Platform } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

export default function StackLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].background,
        },
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 22,
          color: Colors[colorScheme ?? "light"].text,
        },
        headerTintColor: Colors[colorScheme ?? "light"].tint,
        animation: Platform.OS === "ios" ? "default" : "fade_from_bottom",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Inventaire" }} />
      {/*<Stack.Screen
        name="inventaire"
        options={{ title: "Inventaire du matériel" }}
      />*/}
      <Stack.Screen
        name="location"
        options={{ title: "Gestion des locations" }}
      />
    </Stack>
  );
}
