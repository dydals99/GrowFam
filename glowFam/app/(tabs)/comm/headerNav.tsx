import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

const HeaderNav: React.FC = () => {
  const router = useRouter(); // ✅ useRouter는 함수형 컴포넌트 내부에서만 호출 가능

  return (
    <View style={styles.header}>
      {/* ☰ 메뉴 버튼 */}
      <TouchableOpacity style={styles.menuButton} onPress={() => console.log("메뉴 열기")}>
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>

      {/* 화면 제목 */}
      <Text style={styles.headerTitle}>메인 화면</Text>

      {/* 📷 카메라 버튼 */}
      <TouchableOpacity style={styles.cameraButton} onPress={() => router.push("/camera")}>
        <Text style={styles.cameraIcon}>📷</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HeaderNav;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    height: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  menuButton: {
    padding: 5,
  },
  menuIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  cameraButton: {
    padding: 10,
  },
  cameraIcon: {
    fontSize: 24,
  },
});
