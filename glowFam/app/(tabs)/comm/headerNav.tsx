import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Image, Alert } from "react-native";
import { useRouter } from "expo-router";

const HeaderNav: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.header}>
       {/* 프로필 이미지 */}
       <TouchableOpacity
        style={styles.profileSection}
        onPress={() => router.push("../users/userProfile")}> 
        <Image
          source={require("../../../assets/images/다운로드.jpg")} // 기본 프로필 이미지 설정
          style={styles.profileImage}
        />
      </TouchableOpacity>

      {/* 화면 제목 */}
      <Text style={styles.headerTitle}>메인 화면</Text>

      {/* 📷 카메라 버튼 */}
      <TouchableOpacity style={styles.cameraButton} onPress={() => router.push("/measure/measure_list")}>
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
  menuItem: {
    paddingVertical: 10,
  },
  menuText: {
    fontSize: 16,
  },
  profileSection: {
    padding: 5,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});