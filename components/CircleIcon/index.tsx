import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";

type CircleIconProps = {
  name: any;
  size?: number;
};

export const CircleIcon = ({ name, size = 15 }: CircleIconProps) => (
  <View style={styles.circleImage}>
    <Ionicons name={name} size={size} color="gray" />
  </View>
);

const styles = StyleSheet.create({
  circleImage: {
    width: 35,
    height: 35,
    borderRadius: 35 / 2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "lightgray",
    backgroundColor: "white",
    margin: 3,
  },
});
