import { useRef, useState } from "react";
import { ICarouselInstance } from "react-native-reanimated-carousel";
import { useSharedValue } from "react-native-reanimated";
import { StoredCredential } from "@/types";

export function useCredentialCarousel(initialCredentials: StoredCredential[] = []) {
  const [credentials, setCredentials] = useState<StoredCredential[]>(initialCredentials);
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);

  const selectedCredential = credentials[currentIndex];

  const onPressPagination = (index: number) => {
    carouselRef.current?.scrollTo({
      count: index - progress.value,
      animated: true,
    });
  };

  return {
    credentials,
    setCredentials,
    currentIndex,
    setCurrentIndex,
    carouselRef,
    progress,
    selectedCredential,
    onPressPagination,
  };
}
