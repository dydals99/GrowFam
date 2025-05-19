import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { API_URL } from '../../../constants/config';
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";


interface FamilyData {
  user_nickname: string;
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
      {/* 닉네임 */}
      <Text style={styles.familyName}>{item.user_nickname}</Text>

      {/* 프로그레스 바와 퍼센트 */}
      <View style={styles.progressRow}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${item.progress}%` },
            ]}
          />
        </View>
        <Text style={styles.percentText}>{item.progress}%</Text>
      </View>
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
        keyExtractor={(item) => item.user_nickname}
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
                  {goal.completedCount}/{goal.totalCount}
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
    color: '#b7d6bb',
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
    paddingTop: 20, 
  },
  rowContainer: {
    flexDirection: 'column', 
    alignItems: 'flex-start', 
    justifyContent: 'center',
    marginBottom: 15,
  },
  familyName: {
    fontSize: 16,
    color: '#555',
    textAlign: 'left', // 닉네임 좌측 정렬
    marginBottom: 10, // 닉네임과 프로그레스 바 간격 추가
    marginLeft: 10,
  },
  progressRow: {
    flexDirection: 'row', // 가로 정렬
    alignItems: 'center', // 세로 중앙 정렬
    width: '100%',
  },
  progressBarBackground: {
    flex: 1, // 프로그래스 바가 가능한 넓게 차지하도록 설정
    height: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    
    marginLeft: 15, // 퍼센트와 간격 추가
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#b7d6bb',
    borderRadius: 5,
  },
  percentText: {
    fontSize: 14,
    color: '#333',
    width: 55,
    textAlign: 'right', // 퍼센트 우측 정렬
    marginRight: 10,
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
