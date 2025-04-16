// app/(tabs)/index.tsx
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, SafeAreaView } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import HeaderNav from "./comm/headerNav";
import { API_URL } from "../../constants/config";

interface GoalProgress {
  scheduleContent: string;
  completedCount: number;
  totalCount: number;
}

// 달력 locale 설정을 앱 시작 시 한 번만 실행하도록 컴포넌트 바깥에 선언
LocaleConfig.locales["kr"] = {
  monthNames: [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월"
  ],
  dayNames: [
    "일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"
  ],
  dayNamesShort: ["일", "월", "화", "수", "목", "금", "토"],
  today: "오늘"
};
LocaleConfig.defaultLocale = "kr";

// 오늘 날짜를 "YYYY-MM-DD" 형식으로 반환하는 함수
const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // 월은 0부터 시작하므로 +1
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function MainScreen() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([]);
  
  const fetchGoalProgress = async () => {
    try {
      const family_no = 1;
      const response = await fetch(`${API_URL}/schedule/${family_no}`);
      if (!response.ok) throw new Error("목표 진행 데이터를 가져오는데 실패했습니다.");
      const data = await response.json();
      setGoalProgress(data);
    } catch (error: any) {
      console.error("오류:", error.message);
    }
  };

  useEffect(() => {
    fetchGoalProgress();
  }, []);

  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderNav />
      {/* 달력 */}
      <View style={styles.calendarContainer}>
        <Calendar
          // 상단 날짜 포맷: "2025년 4월" 형태로 표시
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
        {goalProgress.map((goal, index) => (
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
              <Text style={styles.goalCount}>{goal.completedCount} of {goal.totalCount}</Text>
            </View>
          </View>
        ))}
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
});
