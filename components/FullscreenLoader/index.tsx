import { Colors } from "@/constants/Colors";
import { ActivityIndicator, StyleSheet } from "react-native";

type FullscreenLoaderProps = {
  isLoading: boolean;
  children: React.ReactNode | React.ReactNode[];
};
export const FullscreenLoader = ({
  isLoading,
  children,
}: FullscreenLoaderProps) => {
  if (isLoading)
    return (
      <ActivityIndicator
        style={styles.loadingSpinner}
        color={Colors.light.orange}
        size="large"
      />
    );

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingSpinner: {
    flex: 1,
  },
});
