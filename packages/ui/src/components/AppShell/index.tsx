import { Pressable, Text, View } from "react-native";

import { appShellStyles } from "./styles";
import type { AppShellProps } from "./types";

/** Renders a shared screen layout for Expo and Electron applications. */
export function AppShell(props: AppShellProps) {
  const { title, children, actionTone, onAction } = props;
  const styles = appShellStyles({ actionTone });

  return (
    <View className={styles.root()}>
      <View className={styles.content()}>
        <Text accessibilityRole="header" className={styles.title()}>
          {title}
        </Text>
        <Text className={styles.description()}>
          Shared by Expo and Electron through React Native Web.
        </Text>
        {children}
        {onAction ? (
          <Pressable
            accessibilityLabel="Try shared UI"
            accessibilityRole="button"
            className={styles.action()}
            onPress={onAction}
          >
            <Text className={styles.actionLabel()}>Try shared UI</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
