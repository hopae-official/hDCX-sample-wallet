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
        color={"black"}
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
