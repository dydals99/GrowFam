import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Button,
} from "react-native";
import HeaderNav from "./comm/headerNav";
import { API_URL } from "../../constants/config";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MeasureChart from "./measure/measureChart";

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

        // AsyncStorage에서 user_no 가져오기
        const userNo = await AsyncStorage.getItem("user_no");
        if (!userNo) {
          console.log("사용자 번호를 찾을 수 없습니다. 로그인 화면으로 이동합니다.");
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

        // 키 측정 데이터 가져오기
        const measureResponse = await fetch(
          `${API_URL}/measure/height?family_no=${family_no}`
        );
        if (!measureResponse.ok) {
          throw new Error("키 측정 데이터를 가져오는데 실패했습니다.");
        }

        const measureData = await measureResponse.json();
        const validData = measureData.filter((item: MeasureData) => {
          return item.measure_height && !isNaN(parseFloat(item.measure_height));
        });
        setData(validData);

        // 아이 정보 가져오기
        const kidInfoResponse = await fetch(
          `${API_URL}/measure/kid-info?family_no=${family_no}`
        );
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

  const handleComparison = async (kid: KidInfo) => {
    const calculateMonths = (birthday: string) => {
      const birthDate = new Date(birthday);
      const today = new Date();
      let months =
        (today.getFullYear() - birthDate.getFullYear()) * 12 +
        (today.getMonth() - birthDate.getMonth());
      if (today.getDate() < birthDate.getDate()) {
        months--;
      }
      return months;
    };

    const ageInMonths = calculateMonths(kid.kid_birthday);

    try {
      const requestData = {
        ageInMonths,
        height: parseFloat(kid.kid_height),
        weight: parseFloat(kid.kid_weight),
        gender: kid.kid_gender === "M" ? 1 : 2,
      };

      const response = await fetch(`${API_URL}/compare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error("API 호출 실패");
      }

      const result = await response.json();
      router.push({
        pathname: "/measure/measure_avg",
        params: { comparisonData: JSON.stringify(result), kid: JSON.stringify(kid) },
      });
    } catch (error) {
      console.error("비교 데이터를 가져오는 중 오류 발생:", error);
      Alert.alert("오류", "비교 데이터를 가져오는 중 문제가 발생했습니다.");
    }
  };

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
    labels: data.map((item) =>
      new Date(item.measure_regist_at).toLocaleDateString()
    ), // 날짜 라벨
    datasets: [
      {
        data: data.map((item) => parseFloat(item.measure_height)), // 유효한 키 값만 사용
        strokeWidth: 2, // 선의 두께
      },
    ],
  };

  const KidItem = ({ item }: { item: KidInfo }) => {
    const gender =
      item.kid_gender === "M"
        ? "남자"
        : item.kid_gender === "W"
        ? "여자"
        : "알 수 없음";

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
        <Button title="평균과 비교" onPress={() => handleComparison(item)} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderNav />
      <View style={styles.container}>
        <Text style={styles.title}>아이 정보</Text>
        {kids.length > 0 ? (
          <FlatList
            data={kids}
            keyExtractor={(item) => item.kid_info_no.toString()}
            renderItem={({ item }) => <KidItem item={item} />}
          />
        ) : (
          <Text style={styles.noDataText}>아이 정보가 없습니다.</Text>
        )}
        <Text style={styles.title}>측정 로그</Text>
        {data.length > 0 ? (
          <MeasureChart data={chartData} />
        ) : (
          <Text style={styles.noDataText}>키 측정 데이터가 없습니다.</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

export default MeasureList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff", // 전체 배경색을 하얀색으로 설정
    padding: 20,
  },
  title: {
    fontSize: 20,
    textAlign: "center",
    marginVertical: 10,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
  noDataText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#888",
  },
  kidItem: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});