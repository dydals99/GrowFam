import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, SafeAreaView, ActivityIndicator, Alert } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import HeaderNav from "./comm/headerNav";
import { API_URL } from "../../constants/config";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";



export default function MainScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  
  useEffect(() => {
  const checkAuthentication = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const userNo = await AsyncStorage.getItem("user_no"); // AsyncStorage에서 user_no 가져오기

      if (!token || !userNo) {
        console.log("JWT 토큰 또는 사용자 번호가 없습니다. 로그인 화면으로 이동합니다.");
        router.replace("./users/login");
        return;
      }

      console.log("사용자 인증 성공:", userNo);
      setIsAuthenticated(true); // 인증 상태 설정
    } catch (error) {
      console.error("오류:", error);
    } finally {
      setIsLoading(false); // 로딩 상태 해제
    }
  };

  checkAuthentication();
}, []);

  useEffect(() => {
    
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null; 
  }
 
  return (
    <SafeAreaView style={styles.container}>
      <HeaderNav />
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#b7d6bb",
  },
});