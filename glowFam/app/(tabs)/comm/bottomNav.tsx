import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const getIcon = (routeName: string, isFocused: boolean) => {
  const color = isFocused ? 'blue' : 'gray';
  switch (routeName.toLowerCase()) {
    case 'index':
      return (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color, fontSize: 24 }}>🏠</Text>
          <Text style={{ color, fontSize: 12 }}>홈</Text>
        </View>
      );
    case 'community/community':
      return (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color, fontSize: 24 }}>💌</Text>
          <Text style={{ color, fontSize: 12 }}>커뮤니티</Text>
        </View>
      );
    case 'schedule/schedule':
      return (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color, fontSize: 24 }}>📝</Text>
          <Text style={{ color, fontSize: 12 }}>일정</Text>
        </View>
      );
    case 'graph/graph':
      return (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color, fontSize: 24 }}>📊</Text>
          <Text style={{ color, fontSize: 12 }}>그래프</Text>
        </View>
      );
    default:
      return (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color, fontSize: 24 }}>❓</Text>
          <Text style={{ color, fontSize: 12 }}>알 수 없음</Text>
        </View>
      );
  }
};

export default function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.bottomNav}>
      {state.routes.map((route, index) => {
        // 각 탭 설정
        const { options } = descriptors[route.key];
        // 화면에 표시될 라벨 (options.title 없으면 route.name)
        const label = options.title ?? route.name;
        // 현재 포커스된 탭인지 여부
        const isFocused = state.index === index;

        // 탭 클릭 시
        const onPress = () => {
          navigation.navigate(route.name as never);
        };

        return (
          <TouchableOpacity key={route.key} style={styles.navItem} onPress={onPress}>
            {getIcon(route.name, isFocused)}
            <Text style={[styles.navIcon, isFocused ? styles.focused : null]}>
              
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
  navIcon: {
    fontSize: 14,
    color: "#222",
  },
  focused: {
    color: "blue",
    fontWeight: "bold",
  },
});
