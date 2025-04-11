import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Alert } from 'react-native';
import { API_URL } from '../../../constants/config';

interface FamilyData {
  family_nickname: string;
  progress: number;
}

const GlowFamScreen: React.FC = () => {
  const [familyProgress, setFamilyProgress] = useState<FamilyData[]>([]);

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
  }, []);

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
      <Text style={styles.title}>GLOWFAM</Text>
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
    width: 100, // 글씨 위치를 안쪽으로 모으기
    fontSize: 16,
    color: '#555',
    textAlign: 'right',
    marginRight: 10, // 오른쪽 간격 조정
  },
  progressBarBackground: {
    width: 180, // 그래프 크기 고정
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
    width: 50, // 오른쪽 텍스트도 안쪽으로 정렬
    textAlign: 'left',
    fontSize: 16,
    color: '#333',
    marginLeft: 10, // 왼쪽 간격 조정
  },
});
