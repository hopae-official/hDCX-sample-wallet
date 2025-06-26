import { useState, useCallback } from "react";
import { Alert } from "react-native";
import logger from "@/utils/logger";

interface UseAsyncActionOptions {
  errorTitle?: string;
  showError?: boolean;
  logError?: boolean;
}

export function useAsyncAction(options: UseAsyncActionOptions = {}) {
  const {
    errorTitle = "Error",
    showError = true,
    logError = true,
  } = options;
  
  const [isLoading, setIsLoading] = useState(false);

  const withLoading = useCallback(async <T>(
    action: () => Promise<T>,
    errorMessage?: string
  ): Promise<{ isSuccess: boolean; data?: T }> => {
    try {
      setIsLoading(true);
      const data = await action();
      return { isSuccess: true, data };
    } catch (error) {
      if (logError) {
        logger.error(errorMessage || errorTitle, error);
      }
      
      if (showError) {
        Alert.alert(
          errorTitle,
          error instanceof Error ? error.message : errorMessage || "An error occurred"
        );
      }

      return { isSuccess: false };
    } finally {
      setIsLoading(false);
    }
  }, [errorTitle, showError, logError]);

  return {
    isLoading,
    withLoading,
  };
}
