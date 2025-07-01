import { Colors } from "@/constants/Colors";
import { ActivityIndicator, StyleSheet, View, Text } from "react-native";

type FullscreenLoaderProps = {
  isLoading: boolean;
  children: React.ReactNode | React.ReactNode[];
  message?: string;
};

export const FullscreenLoader = ({
  isLoading,
  children,
  message,
}: FullscreenLoaderProps) => {
  if (isLoading)
    return (
      <View style={styles.container}>
        <ActivityIndicator
          style={styles.loadingSpinner}
          color={Colors.light.orange}
          size="large"
        />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    );

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  message: {
    color: Colors.light.text,
    fontSize: 16,
    textAlign: 'center',
  },
});
