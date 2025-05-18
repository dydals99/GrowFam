import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, StyleSheet } from "react-native";
import { API_URL } from "../../../constants/config";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HeaderNav from "../comm/headerNav";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import DropDownPicker from "react-native-dropdown-picker";

const KidAdd = () => {
  const [kid, setKid] = useState({
    kid_name: "",
    kid_birthday: "",
    kid_gender: null,
    kid_height: "",
    kid_weight: "",
  });
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [genderItems, setGenderItems] = useState([
    { label: "남자", value: "M" },
    { label: "여자", value: "W" },
  ]);
  const router = useRouter();

  const handleAdd = async () => {
    // 필수 입력값 체크
    if (!kid.kid_name) {
      Alert.alert("입력 오류", "이름을 입력하세요.");
      return;
    }
    if (!kid.kid_birthday) {
      Alert.alert("입력 오류", "생년월일을 입력하세요.");
      return;
    }
    if (!kid.kid_gender) {
      Alert.alert("입력 오류", "성별을 선택하세요.");
      return;
    }
    if (!kid.kid_height) {
      Alert.alert("입력 오류", "키를 입력하세요.");
      return;
    }
    if (!kid.kid_weight) {
      Alert.alert("입력 오류", "몸무게를 입력하세요.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("access_token");
      const userNo = await AsyncStorage.getItem("user_no");
      if (!token || !userNo) {
        router.replace("/users/login");
        return;
      }
      // family_no 가져오기
      const familyResponse = await fetch(`${API_URL}/users/family/${userNo}`);
      const familyData = await familyResponse.json();
      const family_no = familyData.family_no;

      const res = await fetch(`${API_URL}/family/kid/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...kid,
          family_no,
        }),
      });
      if (!res.ok) throw new Error();
      Alert.alert("등록 완료", "아이 정보가 추가되었습니다.");
      router.back();
    } catch {
      Alert.alert("오류", "아이 추가에 실패했습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderNav />
      <View style={styles.formBox}>
        <Text style={styles.label}>이름</Text>
        <TextInput
          style={styles.input}
          value={kid.kid_name}
          onChangeText={v => setKid({ ...kid, kid_name: v })}
        />
        <Text style={styles.label}>생년월일 (YYYY-MM-DD)</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setDatePickerVisibility(true)}
          activeOpacity={0.8}
        >
          <Text style={kid.kid_birthday ? styles.inputText : styles.placeholderText}>
            {kid.kid_birthday || "생년월일을 선택하세요."}
          </Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={(date) => {
            const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            setKid({ ...kid, kid_birthday: formattedDate });
            setDatePickerVisibility(false);
          }}
          onCancel={() => setDatePickerVisibility(false)}
          locale="ko"
        />
        <Text style={styles.label}>성별</Text>
        <DropDownPicker
        open={genderOpen}
        value={kid.kid_gender}
        items={genderItems}
        setOpen={setGenderOpen}
        setValue={(callback) => {
          const value = typeof callback === "function" ? callback(kid.kid_gender) : callback;
          setKid({ ...kid, kid_gender: value });
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
          value={kid.kid_height}
          onChangeText={v => setKid({ ...kid, kid_height: v })}
          keyboardType="numeric"
        />
        <Text style={styles.label}>몸무게 (kg)</Text>
        <TextInput
          style={styles.input}
          value={kid.kid_weight}
          onChangeText={v => setKid({ ...kid, kid_weight: v })}
          keyboardType="numeric"
        />
        <TouchableOpacity style={[styles.saveBtn, { marginTop: 20 }]} onPress={handleAdd}>
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>추가</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default KidAdd;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    margin: 20,
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
});