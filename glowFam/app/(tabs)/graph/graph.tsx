import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { API_URL } from '../../../constants/config';
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";


interface FamilyData {
  family_nickname: string;
  progress: number;
}
interface GoalProgress {
  scheduleContent: string;
  completedCount: number;
  totalCount: number;
}

const GlowFamScreen: React.FC = () => {
  const [familyProgress, setFamilyProgress] = useState<FamilyData[]>([]);
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([]);
  const router = useRouter();

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
  const fetchFamilyProgress = async () => {
    try {
      const response = await fetch(`${API_URL}/graph/family-progress`);
      if (!response.ok) throw new Error("가족 진행률 데이터를 가져오는데 실패했습니다.");
      const data = await response.json();
      setFamilyProgress(data);
    } catch (error: any) {
      Alert.alert("오류", error.message);
    }
  };
  
  useEffect(() => {
    fetchFamilyProgress();
    fetchGoalProgress();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFamilyProgress();
    }, [])
  );

  const renderItem = ({ item }: { item: FamilyData }) => (
    <View style={styles.rowContainer}>
      {/* 가족 닉네임 */}
      <Text style={styles.familyName}>{item.family_nickname}</Text>

      {/* 프로그레스 바 */}
      <View style={styles.progressBarBackground}>
        <View 
          style={[
            styles.progressBarFill, 
            { width: `${item.progress}%` }
          ]} 
        />
      </View>

      {/* 퍼센트 */}
      <Text style={styles.percentText}>{item.progress}%</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 헤더 */}
      <Text style={styles.title}>가족 순위</Text>
      <Text style={styles.subtitle}>가족별 목표치 달성률</Text>

      {/* 구분선 */}
      <View style={styles.separator} />

      {/* 목록 */}
      <FlatList
        data={familyProgress}
        keyExtractor={(item) => item.family_nickname}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      /> 
      {/* 목표 달성 현황 */}
      <View style={styles.familyGoalsContainer}>
        <Text style={styles.familySectionTitle}>우리 가족 목표 달성 현황</Text>
        {goalProgress.length > 0 ? (
          goalProgress.map((goal, index) => (
            <View key={index} style={styles.familyGoalItem}>
              <Text style={styles.familyGoalContent}>{goal.scheduleContent}</Text>
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
                  {goal.completedCount} of {goal.totalCount}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.familyNoGoalsText}>현재 목표가 없습니다.</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

export default GlowFamScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 40, // 좌우 공백 추가
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#58a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#aaa',
    marginVertical: 10,
  },
  listContent: {
    paddingBottom: 20,
    paddingTop: 20, // 목록을 아래로 이동
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // 전체 요소를 중앙 정렬
    marginBottom: 15,
  },
  familyName: {
    width: 160, // 글씨 위치를 안쪽으로 모으기
    fontSize: 16,
    color: '#555',
    textAlign: 'right',
    marginRight: 10, // 오른쪽 간격 조정
  },
  progressBarBackground: {
    width: 150, // 그래프 크기 고정
    height: 10,
    backgroundColor: '#e0f2f1', 
    borderRadius: 5,
    marginHorizontal: 10, // 양쪽 여백 추가
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#9de5dc', // 진행도 색상
    borderRadius: 5,
  },
  percentText: {
    width: 100, // 오른쪽 텍스트도 안쪽으로 정렬
    textAlign: 'left',
    fontSize: 16,
    color: '#333',
    marginLeft: 10, // 왼쪽 간격 조정
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
  noGoalsText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 10,
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
    flex: 1,
    height: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    overflow: "hidden",
    marginVertical: 10,
  },
  familyProgressBarFill: {
    height: "100%",
    backgroundColor: "#76c7c0",
  },
  familyNoGoalsText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 10,
  },
});
