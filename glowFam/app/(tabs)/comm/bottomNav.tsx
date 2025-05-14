import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get("window");

const getIcon = (routeName: string, isFocused: boolean) => {
  const color = isFocused ? "black" : "gray";
  const size = 24;

  switch (routeName.toLowerCase()) {
    case "index":
      return <Ionicons name={isFocused ? "home" : "home-outline"} size={size} color={color} />;
    case "community":
    case "community/community":
      return <Ionicons name={isFocused ? "chatbubble" : "chatbubble-outline"} size={size} color={color} />;
    case "schedule":
    case "schedule/schedule":
      return <Ionicons name={isFocused ? "calendar" : "calendar-outline"} size={size} color={color} />;
    case "graph":
    case "graph/graph":
      return <MaterialCommunityIcons name={isFocused ? "medal" : "medal-outline"} size={size} color={color} />;
    default:
      return <Ionicons name="help-circle-outline" size={size} color={color} />;
  }
};

// ★ 한국어 라벨 매핑 함수
const getLabel = (routeName: string) => {
  switch (routeName.toLowerCase()) {
    case "index":
      return "홈";
    case "community":
    case "community/community":
      return "커뮤니티";
    case "schedule":
    case "schedule/schedule":
      return "일정";
    case "graph":
    case "graph/graph":
      return "순위";
    default:
      return routeName;
  }
};

export default function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.bottomNav}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          navigation.navigate(route.name as never);
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.navItem}
            onPress={onPress}
            activeOpacity={0.7}
          >
            {getIcon(route.name, isFocused)}
            <Text style={[styles.navLabel, isFocused && styles.focusedLabel]}>
              {getLabel(route.name)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 80,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    width: width / 4,
  },
  navLabel: {
    fontSize: 12,
    color: "#222",
    marginTop: 4,
  },
  focusedLabel: {
    color: "black",
    fontWeight: "bold",
  },
});
