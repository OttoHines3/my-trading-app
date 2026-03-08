import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#030712" },
          headerTintColor: "#fff",
          contentStyle: { backgroundColor: "#030712" },
        }}
      />
    </>
  );
}
