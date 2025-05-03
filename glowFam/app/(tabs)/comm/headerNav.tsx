import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage"; // AsyncStorage 추가

const HeaderNav: React.FC = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 메뉴 열림 상태 관리

  // 로그아웃 함수
  const handleLogout = async () => {
    try {
      // 로그아웃 전 토큰 확인 (디버깅용)
      const token = await AsyncStorage.getItem("access_token");
      console.log("로그아웃 전 토큰:", token);
  
      // 토큰 삭제
      await AsyncStorage.removeItem("access_token");
  
      // 삭제 후 토큰 확인 (디버깅용)
      const tokenAfterRemoval = await AsyncStorage.getItem("access_token");
      console.log("로그아웃 후 토큰:", tokenAfterRemoval);
  
      // 로그아웃 성공 메시지
      Alert.alert("로그아웃", "성공적으로 로그아웃되었습니다.");
  
      // 로그인 화면으로 이동
      router.replace("../users/login");
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
      Alert.alert("오류", "로그아웃에 실패했습니다.");
    }
  };

  return (
    <View style={styles.header}>
      {/* ☰ 메뉴 버튼 */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setIsMenuOpen(!isMenuOpen)} // 메뉴 열기/닫기 토글
      >
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>

      {/* 드롭다운 메뉴 */}
      {isMenuOpen && (
        <View style={styles.dropdownMenu}>
          {/* 프로필 사진 */}
          <View style={styles.profileSection}>
            <Image
              source={require("../../../assets/images/다운로드.jpg")} // 기본 프로필 이미지 설정
              style={styles.profileImage}
            />
          </View>

          {/* 정보 관리 */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("../users/userInfo")} // 정보 관리 페이지로 이동
          >
            <Text style={styles.menuText}>정보 관리</Text>
          </TouchableOpacity>

          {/* 로그아웃 */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout} // 로그아웃 함수 호출
          >
            <Text style={styles.menuText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      )}

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
  dropdownMenu: {
    position: "absolute",
    top: 60,
    left: 15,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    zIndex: 1000,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  menuItem: {
    paddingVertical: 10,
  },
  menuText: {
    fontSize: 16,
  },
});