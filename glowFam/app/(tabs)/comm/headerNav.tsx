import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../../constants/config";

const HeaderNav: React.FC = () => {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const userNo = await AsyncStorage.getItem("user_no");
        if (!userNo) {
          console.log("user_no가 없습니다. 로그인 화면으로 이동합니다.");
          router.replace("../users/login");
          return;
        }

        const response = await fetch(`${API_URL}/users/user-info/${userNo}`);
        if (!response.ok) {
          console.error("프로필 이미지를 가져오는데 실패했습니다.");
          return;
        }

        const data = await response.json();
        if (data.profileImage) {
          setProfileImage(`${API_URL}/${data.profileImage}`); 
        } else {
          setProfileImage(null); 
        }
      } catch (error) {
        console.error("프로필 이미지를 가져오는 중 오류 발생:", error);
      }
    };

    fetchProfileImage();
  }, []);

  return (
    <View style={styles.header}>
      {/* 프로필 이미지 */}
      <TouchableOpacity
        style={styles.profileSection}
        onPress={() => router.push("../users/userProfile")}
      >
        <Image
          source={
            profileImage
              ? { uri: profileImage }
              : require("../../../assets/images/다운로드.jpg") 
          }
          style={styles.profileImage}
        />
      </TouchableOpacity>

      {/* 화면 제목 */}
      <Text style={styles.headerTitle}>GrowFam</Text>

     
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