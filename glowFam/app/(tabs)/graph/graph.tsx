import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { API_URL } from '../../../constants/config';
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GestureRecognizer from 'react-native-swipe-gestures';
import { BarChart } from 'react-native-gifted-charts';


interface GoalProgress {
  scheduleContent: string;
  completedCount: number;
  totalCount: number;
}

const GlowFamScreen: React.FC = () => {
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([]);
  const [myProgress, setMyProgress] = useState(0);
  const [avgProgress, setAvgProgress] = useState(0);
  const [top10Progress, setTop10Progress] = useState(0);

  const [weeklyCompleted, setWeeklyCompleted] = useState(0);
  const [myRankPercent, setMyRankPercent] = useState(0);

  const [myRank, setMyRank] = useState(0);
  const [totalFamilies, setTotalFamilies] = useState(0);

  const [page, setPage] = useState(0); // 0: 목표 달성률
  const router = useRouter();

  // family_no를 먼저 가져와서 진행률 통계 조회
  const fetchGraphStats = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const userNo = await AsyncStorage.getItem("user_no");
      if (!token || !userNo) return;

      // family_no 조회
      const familyResponse = await fetch(`${API_URL}/users/family/${userNo}`);
      if (!familyResponse.ok) return;
      const familyData = await familyResponse.json();
      const family_no = familyData.family_no;

      // 진행률 통계 조회 (API 엔드포인트는 예시, 실제 서버에 맞게 수정)
      const res = await fetch(`${API_URL}/graph/family-stats/${family_no}`);
      if (!res.ok) return;
      const stats = await res.json();
      setMyProgress(stats.myProgress);
      setAvgProgress(stats.avgProgress); 
      setTop10Progress(stats.top10Progress); 
      setWeeklyCompleted(stats.weeklyCompleted); 
      setMyRankPercent(stats.myRankPercent); 
      setMyRank(stats.myRank); 
      setTotalFamilies(stats.totalFamilies); 
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGoalProgress = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const userNo = await AsyncStorage.getItem("user_no"); 
      if (!token || !userNo) {
        console.log("토큰 또는 사용자 번호가 없습니다.");
        router.replace("./users/login");
        return;
      }

      // 가족 정보 가져오기
      const familyResponse = await fetch(`${API_URL}/users/family/${userNo}`);
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
    fetchGoalProgress();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchGraphStats();
      fetchGoalProgress();
    }, [])
  );

  const onSwipeLeft = () => {};
  const onSwipeRight = () => {};

  return (
    <SafeAreaView style={styles.container}>
      <GestureRecognizer
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
        style={{ flex: 1 }}
      >
        {/* 가족 목표 달성률 비교 화면 */}
        <>
          <Text style={styles.title}>가족 목표 달성률 비교</Text>
          <View style={{ marginBottom: 10, marginLeft:5 }}>
            <BarChart
              data={[
                { value: myProgress, label: '우리 가족', frontColor: '#b7d6bb' },
                { value: avgProgress, label: '평균', frontColor: '#a0a0a0' },
                { value: top10Progress, label: '상위 10%', frontColor: '#ffd700' },
              ]}
            barWidth={32}
            spacing={60}
            maxValue={100}
            height={220}
            yAxisLabelSuffix="%"
            yAxisLabelWidth={50} // ← 이 값을 40~50 정도로 늘려보세요!
            noOfSections={4}
            />
          </View>
          <View style={styles.weeklyReportContainer}>
            <Text style={styles.weeklyReportText}>
              이번 주는 목표 {weeklyCompleted}일 완료!{"\n"}
              전체 {totalFamilies}명 중 {myRank}등, {"\n"}상위 {myRankPercent}% 안에 들었어요!
            </Text>
          </View>
          <View style={styles.familyGoalsContainer}>
            <Text style={styles.familySectionTitle}>우리 가족 전체일정 달성률</Text>
            {goalProgress.length > 0 ? (
              goalProgress.map((goal, index) => (
                <View key={index} style={styles.familyGoalItem}>
                  
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}>
                    <View style={styles.familyProgressBarBackground}>
                      <View
                        style={{
                          ...styles.familyProgressBarFill,
                          width: `${(goal.completedCount / goal.totalCount) * 100}%`,
                        }}
                      />
                    </View>
                    <Text style={styles.familyGoalCount}>
                      {goal.totalCount > 0
                        ? `${Math.round((goal.completedCount / goal.totalCount) * 100)}%`
                        : '0%'}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.familyNoGoalsText}>현재 목표가 없습니다.</Text>
            )}
          </View>
          <View style={styles.familyGoalsContainer}>
            <Text style={styles.familySectionTitle}>이번 주(월~일)</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}>
              <View style={styles.familyProgressBarBackground}>
                <View
                  style={{
                    ...styles.familyProgressBarFill,
                    width: `${(weeklyCompleted / 7) * 100}%`,
                  }}
                />
              </View>
              <Text style={styles.familyGoalCount}>
                {weeklyCompleted} / 7
              </Text>
            </View>
          </View>
        </>
      </GestureRecognizer>
    </SafeAreaView>
  );
};

export default GlowFamScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    marginTop:30,
    textAlign: 'center',
  },
  weeklyReportContainer: {
    backgroundColor: "#f0f8f5",
    borderRadius: 12,
    padding: 20,
    marginBottom: 10,
    alignItems: "center",
  },
  weeklyReportText: {
    fontSize: 18,
    color: "#333",
    fontWeight: "bold",
    textAlign: "center",
  },
  familyGoalsContainer: {
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
  familySectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  familyGoalItem: {
    flexDirection: "column",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  familyGoalContent: {
    fontSize: 16,
    color: "#333",
    width: "100%",
  },
  familyGoalCount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  familyProgressBarBackground: {
    width: 270,
    height: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginHorizontal: 10,
  },
  familyProgressBarFill: {
    height: "100%",
    backgroundColor: "#b7d6bb",
  },
  familyNoGoalsText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 10,
  },
});