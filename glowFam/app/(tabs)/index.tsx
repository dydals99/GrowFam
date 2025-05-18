import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, SafeAreaView, ActivityIndicator, Alert, Button, TouchableOpacity, ScrollView,} from "react-native";
import HeaderNav from "./comm/headerNav";
import { API_URL } from "../../constants/config";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MeasureChart from "./measure/measureChart";
import { useFocusEffect } from '@react-navigation/native';

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
    kid_name: string;
  }

  const [kids, setKids] = useState<KidInfo[]>([]);
  const [data, setData] = useState<MeasureData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKidIndex, setSelectedKidIndex] = useState(0);
  const [growthTab, setGrowthTab] = useState<"list" | "chart">("list");
  const [showAllGrowth, setShowAllGrowth] = useState(false);

  const router = useRouter();

  const fetchFamilyData = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        router.replace("./users/login");
        return;
      }
      const userNo = await AsyncStorage.getItem("user_no");
      if (!userNo) {
        router.replace("./users/login");
        return;
      }
      const familyResponse = await fetch(`${API_URL}/users/family/${userNo}`);
      if (!familyResponse.ok) {
        return;
      }
      const familyData = await familyResponse.json();
      const family_no = familyData.family_no;

      // 아이 정보 먼저 가져오기
      const kidInfoResponse = await fetch(
        `${API_URL}/measure/kid-info?family_no=${family_no}`
      );
      if (!kidInfoResponse.ok) {
        throw new Error("아이 정보를 가져오는데 실패했습니다.");
      }
      const kidInfoData = await kidInfoResponse.json();
      setKids(kidInfoData);

      if (kidInfoData.length > 0) {
        const firstKidInfoNo = kidInfoData[0].kid_info_no;
        await fetchKidMeasureData(firstKidInfoNo);
      }
    } catch (error) {
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilyData();
  }, []);
  useFocusEffect(
    React.useCallback(() => {
      if (kids.length > 0) {
        fetchKidMeasureData(kids[selectedKidIndex].kid_info_no);
      } else {
        fetchFamilyData();
      }
    }, [kids, selectedKidIndex])
  );  
  const fetchKidMeasureData = async (kid_info_no: number) => {
    try {
      setLoading(true);
      const measureResponse = await fetch(
        `${API_URL}/measure/height?kid_info_no=${kid_info_no}`
      );
      if (!measureResponse.ok) {
        throw new Error("키 측정 데이터를 가져오는데 실패했습니다.");
      }
      const measureData = await measureResponse.json();
      const validData = measureData.filter((item: MeasureData) => {
        return item.measure_height && !isNaN(parseFloat(item.measure_height));
      });
      setData(validData);
      setShowAllGrowth(false); 
    } catch (error) {
      setError("키 측정 데이터를 불러오는 중 오류가 발생했습니다.");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectKid = (idx: number) => {
    setSelectedKidIndex(idx);
    const kid = kids[idx];
    fetchKidMeasureData(kid.kid_info_no);
  };

  const renderGrowthList = () => {
    // 오래된 순 정렬
    const sorted = data
      .slice()
      .sort(
        (a, b) =>
          new Date(a.measure_regist_at).getTime() -
          new Date(b.measure_regist_at).getTime()
      );
    const displayList = showAllGrowth ? sorted : sorted.slice(-4); // 최신 4개만
    return (
      <View style={{ marginTop: 10 }}>
        {displayList.length > 0 ? (
          displayList
            .map((item, idx, arr) => {
           
              const globalIdx = sorted.indexOf(item);
              const prev =
                globalIdx > 0
                  ? parseFloat(sorted[globalIdx - 1].measure_height)
                  : null;
              const curr = parseFloat(item.measure_height);
              let diffText = "";
              if (prev !== null) {
                const diff = curr - prev;
                if (diff > 0) diffText = `+${diff.toFixed(1)}cm`;
              }
              return (
                <View
                  key={globalIdx}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderColor: "#eee",
                  }}
                >
                  <Text style={{ fontSize: 15 }}>
                    {new Date(item.measure_regist_at).toLocaleDateString()}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {diffText ? (
                      <Text
                        style={{
                          fontSize: 13,
                          color: "#2e7d32",
                          marginRight: 8,
                        }}
                      >
                        ({diffText})
                      </Text>
                    ) : null}
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "bold",
                        minWidth: 70,
                        textAlign: "right",
                      }}
                    >
                      {item.measure_height} cm
                    </Text>
                  </View>
                </View>
              );
            })
            .reverse() // 최근순으로 보여주기
        ) : (
          <Text style={styles.noDataText}>키 측정 데이터가 없습니다.</Text>
        )}
        {/* 더보기 버튼 */}
        {!showAllGrowth && data.length > 4 && (
          <TouchableOpacity
            style={{
              marginTop: 8,
              alignSelf: "center",
              paddingHorizontal: 18,
              paddingVertical: 8,
              borderRadius: 16,
              backgroundColor: "#eee",
            }}
            onPress={() => setShowAllGrowth(true)}
          >
            <Text style={{ color: "#222", fontWeight: "bold" }}>더보기</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

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
      Alert.alert("오류", "비교 데이터를 가져오는 중 문제가 발생했습니다.");
    }
  };

  const handleManageKid = (kid: KidInfo) => {
    router.push({
      pathname: "/family/kid_info",
      params: { kid: JSON.stringify(kid) },
    });
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
    labels: data.map(item => {
      const d = new Date(item.measure_regist_at);
      return `${d.getMonth() + 1}/${d.getDate()}`; // 년도 생략, 월/일만
    }),
    datasets: [
      {
        data: data.map(item => parseFloat(item.measure_height)),
        strokeWidth: 2,
      },
    ],
  };

  // 이름 탭 UI
  const renderKidTabs = () => (
    <View style={styles.tabContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {kids.map((kid, idx) => (
          <TouchableOpacity
            key={kid.kid_info_no}
            style={[
              styles.kidTab,
              selectedKidIndex === idx && styles.kidTabSelected,
            ]}
            onPress={() => handleSelectKid(idx)}
          >
            <Text
              style={[
                styles.kidTabText,
                selectedKidIndex === idx && styles.kidTabTextSelected,
              ]}
            >
              {kid.kid_name || `아이${idx + 1}`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={styles.manageBtn}
        onPress={() => handleManageKid(kids[selectedKidIndex])}
      >
        <Text style={styles.manageBtnText}>관리</Text>
      </TouchableOpacity>
    </View>
  );

  const KidItem = ({ kid }: { kid: KidInfo }) => {
    const gender =
      kid.kid_gender === "M"
        ? "남자"
        : kid.kid_gender === "W"
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

    const formatDate = (birthday: string) => {
      const date = new Date(birthday);
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    const age = calculateAge(kid.kid_birthday);

    return (
      <View style={styles.kidInfoBox}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>생일</Text>
          <Text style={styles.infoValue}>{formatDate(kid.kid_birthday)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>성별</Text>
          <Text style={styles.infoValue}>{gender}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>나이</Text>
          <Text style={styles.infoValue}>{age}세</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>몸무게</Text>
          <Text style={styles.infoValue}>{kid.kid_weight}kg</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>키</Text>
          <Text style={styles.infoValue}>{kid.kid_height}cm</Text>
        </View>
        <View style={styles.divider} />
        {/* 버튼 2개를 같은 행에 배치 */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={[styles.compareBtn, { flex: 1 }]}
            onPress={() => handleComparison(kid)}
          >
            <Text style={styles.compareBtnText}>평균과 비교</Text>
          </TouchableOpacity>
          <TouchableOpacity
          style={[styles.compareBtn, { flex: 1, backgroundColor: "#eee" }]}
          onPress={() =>
            router.push({
              pathname: "/measure/camera",
              params: { kid_info_no: kid.kid_info_no.toString() },
            })
          }
          >
            <Text style={{ color: "#000", fontWeight: "bold", fontSize: 16 }}>
              키 측정
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderNav />
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.container}>
          {kids.length > 0 ? (
            <>
              {renderKidTabs()}
              <KidItem kid={kids[selectedKidIndex]} />
              {/* 성장 기록 탭과 KidItem 사이 간격 추가 */}
              <View style={{ height: 18 }} />
            </>
          ) : (
            <Text style={styles.noDataText}>아이 정보가 없습니다.</Text>
          )}
          {/* 성장 기록 탭 */}
          <View style={styles.growthTabWrapper}>
            <TouchableOpacity
              style={[
                styles.growthTabBtn,
                growthTab === "list" && styles.growthTabBtnActive,
                { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
              ]}
              onPress={() => setGrowthTab("list")}
            >
              <Text
                style={[
                  styles.growthTabBtnText,
                  growthTab === "list" && styles.growthTabBtnTextActive,
                ]}
              >
                리스트
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.growthTabBtn,
                growthTab === "chart" && styles.growthTabBtnActive,
                { borderTopRightRadius: 8, borderBottomRightRadius: 8 },
              ]}
              onPress={() => setGrowthTab("chart")}
            >
              <Text
                style={[
                  styles.growthTabBtnText,
                  growthTab === "chart" && styles.growthTabBtnTextActive,
                ]}
              >
                그래프
              </Text>
            </TouchableOpacity>
          </View>
          {/* 성장 기록 내용 */}
          {growthTab === "list" ? (
            renderGrowthList()
          ) : data.length > 0 ? (
            <View style={{ minHeight: 260 }}>
              <ScrollView horizontal>
                <MeasureChart data={chartData} />
              </ScrollView>
            </View>
          ) : (
            <Text style={styles.noDataText}>
              키 측정 데이터가 없습니다. 키 측정을 시작하세요.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MeasureList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
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
  tabContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  kidTab: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#eee",
    marginRight: 8,
  },
  kidTabSelected: {
    backgroundColor: "#b7d6bb",
  },
  kidTabText: {
    fontSize: 15,
    color: "#333",
  },
  kidTabTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  manageBtn: {
    marginLeft: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  manageBtnText: {
    color: "#aaa",
    fontWeight: "bold",
    fontSize: 16,
  },
  kidInfoBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    color: "#888",
    fontSize: 15,
    width: 60,
  },
  infoValue: {
    color: "#4A4A4A",
    fontSize: 15,
    fontWeight: "bold",
  },
  divider: {
    borderBottomWidth: 1,
    borderColor: "#eee",
    marginVertical: 12,
  },
  compareBtn: {
    backgroundColor: "#b7d6bb",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  compareBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  growthTabWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 8,
    backgroundColor: "#eaeaea",
    borderRadius: 8,
    overflow: "hidden",
    height: 38,
  },
  growthTabBtn: {
    flex: 1,
    backgroundColor: "#eaeaea",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  growthTabBtnActive: {
    backgroundColor: "#222",
  },
  growthTabBtnText: {
    fontSize: 16,
    color: "#222",
    fontWeight: "bold",
  },
  growthTabBtnTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
});