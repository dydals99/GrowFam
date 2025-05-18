import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Alert, SafeAreaView, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { API_URL } from "../../../constants/config";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HeaderNav from "../comm/headerNav";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import DropDownPicker from "react-native-dropdown-picker";

interface KidInfo {
  kid_info_no: number;
  kid_birthday: string;
  kid_weight: string;
  kid_height: string;
  kid_gender: string;
  kid_name: string;
}

const KidInfoManage = () => {
  const [kids, setKids] = useState<KidInfo[]>([]);
  const [selectedKidIndex, setSelectedKidIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editKid, setEditKid] = useState<Partial<KidInfo>>({});
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [genderItems, setGenderItems] = useState([
    { label: "남자", value: "M" },
    { label: "여자", value: "W" },
  ]);
  const router = useRouter();

  // 아이 정보 불러오기
  const fetchKids = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      const userNo = await AsyncStorage.getItem("user_no");
      if (!token || !userNo) {
        router.replace("/users/login");
        return;
      }
      const familyResponse = await fetch(`${API_URL}/users/family/${userNo}`);
      const familyData = await familyResponse.json();
      const family_no = familyData.family_no;
      const kidInfoResponse = await fetch(`${API_URL}/measure/kid-info?family_no=${family_no}`);
      const kidInfoData = await kidInfoResponse.json();
      setKids(kidInfoData);
      setEditKid(kidInfoData[0] || {});
    } catch (e) {
      Alert.alert("오류", "아이 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKids();
  }, []);

  // 탭 변경 시 수정폼도 해당 아이로 변경
  useEffect(() => {
    if (kids[selectedKidIndex]) setEditKid(kids[selectedKidIndex]);
  }, [selectedKidIndex, kids]);

  // 아이 정보 수정
  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/family/kid/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editKid),
      });
      if (!res.ok) throw new Error();
      Alert.alert("저장 완료", "아이 정보가 수정되었습니다.");
      fetchKids();
    } catch {
      Alert.alert("오류", "수정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 아이 삭제
  const handleDelete = async () => {
    Alert.alert(
      "삭제 확인",
      "정말로 이 아이 정보를 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const res = await fetch(`${API_URL}/family/kid/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kid_info_no: editKid.kid_info_no }),
              });
              if (!res.ok) throw new Error();
              Alert.alert("삭제 완료", "아이 정보가 삭제되었습니다.");
              fetchKids();
              setSelectedKidIndex(0);
            } catch {
              Alert.alert("오류", "삭제에 실패했습니다.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // 성별 value를 label로 변환
  const getGenderLabel = (value?: string) => {
    if (value === "M") return "남자";
    if (value === "W") return "여자";
    return "";
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>불러오는 중...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HeaderNav />
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {kids.map((kid, idx) => (
            <TouchableOpacity
              key={kid.kid_info_no}
              style={[
                styles.kidTab,
                selectedKidIndex === idx && styles.kidTabSelected,
              ]}
              onPress={() => setSelectedKidIndex(idx)}
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
      </View>
      {/* 아이 정보 수정 폼 */}
      {kids[selectedKidIndex] && (
        <View style={styles.formBox}>
          <Text style={styles.label}>이름</Text>
          <TextInput
            style={styles.input}
            value={editKid.kid_name}
            onChangeText={v => setEditKid({ ...editKid, kid_name: v })}
          />
          <Text style={styles.label}>생년월일 (YYYY-MM-DD)</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setDatePickerVisibility(true)}
            activeOpacity={0.8}
          >
            <Text style={editKid.kid_birthday ? styles.inputText : styles.placeholderText}>
              {editKid.kid_birthday || "생년월일을 선택하세요."}
            </Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={(date) => {
              const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
                .toString()
                .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
              setEditKid({ ...editKid, kid_birthday: formattedDate });
              setDatePickerVisibility(false);
            }}
            onCancel={() => setDatePickerVisibility(false)}
            locale="ko"
          />
          <Text style={styles.label}>성별</Text>
          <DropDownPicker
            open={genderOpen}
            value={editKid.kid_gender ?? null}
            items={genderItems}
            setOpen={setGenderOpen}
            setValue={(callbackOrValue) => {
              const value = typeof callbackOrValue === "function"
                ? callbackOrValue(editKid.kid_gender)
                : callbackOrValue;
              setEditKid({ ...editKid, kid_gender: value });
            }}
            setItems={setGenderItems}
            placeholder="성별을 선택하세요."
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            zIndex={1000}
            zIndexInverse={1000}
          />
          <Text style={styles.label}>키 (cm)</Text>
          <TextInput
            style={styles.input}
            value={editKid.kid_height}
            onChangeText={v => setEditKid({ ...editKid, kid_height: v })}
            keyboardType="numeric"
          />
          <Text style={styles.label}>몸무게 (kg)</Text>
          <TextInput
            style={styles.input}
            value={editKid.kid_weight}
            onChangeText={v => setEditKid({ ...editKid, kid_weight: v })}
            keyboardType="numeric"
          />
          <View style={{ flexDirection: "row", marginTop: 20, gap: 10 }}>
          <TouchableOpacity style={[styles.saveBtn, { flex: 1 }]} onPress={handleSave}>
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>저장</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.deleteBtn, { flex: 1 }]} onPress={handleDelete}>
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>삭제</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addBtn, { flex: 1 }]} onPress={() => router.push("/family/kid_add")}>
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>추가</Text>
          </TouchableOpacity>
        </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default KidInfoManage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    marginLeft: 12,
    marginTop: 12
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
  formBox: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  label: {
    fontSize: 15,
    color: "#888",
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginTop: 4,
    backgroundColor: "#fff",
  },
  inputText: {
    fontSize: 16,
    color: "#000",
  },
  placeholderText: {
    fontSize: 16,
    color: "#aaa",
  },
  dropdown: {
    marginTop: 4,
    marginBottom: 8,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    minHeight: 48,
  },
  dropdownContainer: {
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    zIndex: 1000,
  },
  saveBtn: {
    backgroundColor: "#7bb6fa",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteBtn: {
    backgroundColor: "#fa7b7b",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addBtn: {
    backgroundColor: "#7bd67b",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});