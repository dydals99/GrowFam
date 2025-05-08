import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, SafeAreaView, ActivityIndicator, Alert } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import HeaderNav from "./comm/headerNav";
import { API_URL } from "../../constants/config";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface GoalProgress {
  scheduleContent: string;
  completedCount: number;
  totalCount: number;
}

// 달력 locale 설정
LocaleConfig.locales["kr"] = {
  monthNames: [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월",
  ],
  dayNames: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"],
  dayNamesShort: ["일", "월", "화", "수", "목", "금", "토"],
  today: "오늘",
};
LocaleConfig.defaultLocale = "kr";

// 오늘 날짜를 "YYYY-MM-DD" 형식으로 반환하는 함수
const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function MainScreen() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchGoalProgress = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        
        return;
      }

      // 사용자 정보 가져오기
      const userResponse = await fetch(`${API_URL}/users/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!userResponse.ok) {
        console.log("사용자 정보를 가져오는데 실패했습니다.");
        return;
      }
      const userData = await userResponse.json();
      const user_no = userData.user_no;

      // 가족 정보 가져오기
      const familyResponse = await fetch(`${API_URL}/users/family/${user_no}`);
      if (!familyResponse.ok) {
        console.error("가족 정보를 가져오는데 실패했습니다.");
        return;
      }
      const familyData = await familyResponse.json();
      const family_no = familyData.family_no;

      // 목표 진행 데이터 가져오기
      const response = await fetch(`${API_URL}/schedule/${family_no}`);
      if (!response.ok) {
        console.error("목표 진행 데이터를 가져오는데 실패했습니다.");
        return;
      }
      const data = await response.json();
      setGoalProgress(data);
    } catch (error: any) {
      console.error("오류:", error.message);
    }
  };

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        if (!token) {
          console.log("JWT 토큰이 없습니다. 로그인 화면으로 이동합니다.");
          router.replace("./users/login");
          return;
        }

        const response = await fetch(`${API_URL}/users/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.log("사용자 인증에 실패했습니다.");
          if (response.status === 401) {
            console.log("토큰이 유효하지 않거나 만료되었습니다. 로그인 화면으로 이동합니다.");
            router.replace("./users/login");
          }
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error("오류:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  useEffect(() => {
    fetchGoalProgress();
  }, []);

  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null; // 로그인 화면으로 리다이렉트 중이므로 아무것도 렌더링하지 않음
  }

  return (
    <SafeAreaView style={styles.container}>
      <HeaderNav />
      {/* 달력 */}
      <View style={styles.calendarContainer}>
        <Calendar
          monthFormat={"yyyy년 M월"}
          initialDate={selectedDate}
          onDayPress={handleDayPress}
          markedDates={{
            [selectedDate]: { selected: true, selectedColor: "#FF6961" },
          }}
          theme={{
            arrowColor: "#000",
            todayTextColor: "#FF6961",
          }}
        />
      </View>
      {/* 목표 달성 현황 */}
      <View style={styles.goalsContainer}>
        <Text style={styles.sectionTitle}>목표 달성 현황</Text>
        {goalProgress.length > 0 ? (
          goalProgress.map((goal, index) => (
            <View key={index} style={styles.goalItem}>
              <Text style={styles.goalContent}>{goal.scheduleContent}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={{
                      ...styles.progressBarFill,
                      width: `${(goal.completedCount / goal.totalCount) * 100}%`,
                    }}
                  />
                </View>
                <Text style={styles.goalCount}>
                  {goal.completedCount} of {goal.totalCount}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noGoalsText}>현재 목표가 없습니다.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#b7d6bb",
  },
  calendarContainer: {
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  goalsContainer: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  goalItem: {
    flexDirection: "column",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  goalContent: {
    fontSize: 16,
    color: "#333",
    width: "100%",
  },
  goalCount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  progressBarBackground: {
    flex: 1,
    height: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    overflow: "hidden",
    marginVertical: 10,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#76c7c0",
  },
  noGoalsText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 10,
  },
});