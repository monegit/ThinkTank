import { StatusBar } from "expo-status-bar";
import { Alert } from "react-native";
import { AppShell } from "@think-tank/ui";
import "@think-tank/styles";

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <AppShell title="ThinkTank Mobile" onAction={() => Alert.alert("Shared UI", "This component comes from @think-tank/ui.")} />
    </>
  );
}
