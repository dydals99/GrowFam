import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { API_URL } from "../../../constants/config";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MeasureChart from './measureChart';

const MeasureList = () => {
  interface MeasureData {
    measure_regist_at: string;
    measure_height: string;
    family_no: number;
  }

  interface KidInfo {
    kid_info_no: number;
    kid_birthday: string;
    kid_weight: string;
    kid_height: string;
    kid_gender: string;
  }

  const [data, setData] = useState<MeasureData[]>([]);
  const [kids, setKids] = useState<KidInfo[]>([]);
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState<string | null>(null); // 에러 상태
  const router = useRouter();

  useEffect(() => {
    const fetchFamilyData = async () => {
      try {
        // JWT 토큰 가져오기
        const token = await AsyncStorage.getItem("access_token");
        if (!token) {
          console.log("JWT 토큰이 없습니다. 로그인 화면으로 이동합니다.");
          router.replace("./users/login");
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
          console.error("사용자 정보를 가져오는데 실패했습니다.");
          if (userResponse.status === 401) {
            console.log("토큰이 유효하지 않거나 만료되었습니다. 로그인 화면으로 이동합니다.");
            router.replace("./users/login");
          }
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

        // 키 측정 데이터 가져오기
        const measureResponse = await fetch(`${API_URL}/measure/height?family_no=${family_no}`);
        if (!measureResponse.ok) {
          throw new Error("키 측정 데이터를 가져오는데 실패했습니다.");
        }

        const measureData = await measureResponse.json();
        const validData = measureData.filter((item: MeasureData) => {
          return item.measure_height && !isNaN(parseFloat(item.measure_height));
        });
        setData(validData);

        // 아이 정보 가져오기
        const kidInfoResponse = await fetch(`${API_URL}/measure/kid-info?family_no=${family_no}`);
        if (!kidInfoResponse.ok) {
          throw new Error("아이 정보를 가져오는데 실패했습니다.");
        }

        const kidInfoData = await kidInfoResponse.json();
        setKids(kidInfoData);
      } catch (error) {
        console.error(error);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false); // 로딩 상태 해제
      }
    };

    fetchFamilyData();
  }, []);
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>데이터를 불러오는 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const chartData = {
    labels: data.map(item => new Date(item.measure_regist_at).toLocaleDateString()), // 날짜 라벨
    datasets: [
      {
        data: data.map(item => parseFloat(item.measure_height)), // 유효한 키 값만 사용
        strokeWidth: 2, // 선의 두께
      },
    ],
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.cameraButton} onPress={() => router.push("./camera")}>
        <Text style={styles.cameraIcon}>📷</Text>
      </TouchableOpacity>
      <Text style={styles.title}>키 측정 데이터</Text>
      {data.length > 0 ? (
        <MeasureChart data={chartData} />
      ) : (
        <Text style={styles.noDataText}>키 측정 데이터가 없습니다.</Text>
      )}
      <Text style={styles.title}>아이 정보</Text>
      {kids.length > 0 ? (
        <FlatList
          data={kids}
          keyExtractor={(item) => item.kid_info_no.toString()}
          renderItem={({ item }) => {
            // 성별 변환
            const gender = item.kid_gender === "M" ? "남자" : item.kid_gender === "W" ? "여자" : "알 수 없음";

            // 만 나이 계산
            const calculateAge = (birthday: string) => {
              const birthDate = new Date(birthday);
              const today = new Date();
              let age = today.getFullYear() - birthDate.getFullYear();
              const monthDiff = today.getMonth() - birthDate.getMonth();
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }
              return age;
            };

            const age = calculateAge(item.kid_birthday);

            return (
              <View style={styles.kidItem}>
                <Text>성별: {gender}</Text>
                <Text>나이: {age}세</Text>
                <Text>몸무게: {item.kid_weight}kg</Text>
                <Text>키: {item.kid_height}cm</Text>
              </View>
            );
          }}
        />
      ) : (
        <Text style={styles.noDataText}>아이 정보가 없습니다.</Text>
      )}
    </View>
  );
};

export default MeasureList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // 전체 배경색을 하얀색으로 설정
    padding: 20,
  },
  cameraButton: {
    padding: 10,
    alignSelf: 'flex-end',
  },
  cameraIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 10,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
  kidItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});