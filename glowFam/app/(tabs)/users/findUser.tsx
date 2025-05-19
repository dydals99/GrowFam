import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../../constants/config';

export default function FindUserScreen() {
  const [tab, setTab] = useState<"id" | "pw">("id");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleFindId = async () => {
    if (!name || !phone) {
      Alert.alert("이름과 전화번호를 모두 입력하세요.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/users/find-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_name: name, user_phone: phone }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert("ID 찾기 결과", `가입된 이메일: ${data.user_email}`, [
          { text: "확인", onPress: () => router.replace("/users/login") }
        ]);
      } else {
        Alert.alert("일치하는 회원이 없습니다.");
      }
    } catch (e) {
      Alert.alert("ID 찾기 실패", "일치하는 회원이 없습니다.");
    }
  };

  const handleFindPw = async () => {
    if (!email) {
      Alert.alert("이메일을 입력하세요.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/users/find-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: email }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert("임시 비밀번호 전송", "임시 비밀번호가 이메일로 전송되었습니다.", [
          { text: "확인", onPress: () => router.replace("/users/login") }
        ]);
      } else {
        Alert.alert("해당 이메일로 가입된 회원이 없습니다.");
      }
    } catch (e) {
      Alert.alert("비밀번호 찾기 실패", "해당 이메일로 가입된 회원이 없습니다.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
        >
        <Ionicons name="arrow-back" size={28} color="#333" />
      </TouchableOpacity>
      <View style={styles.tabWrap}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "id" && styles.tabBtnActive]}
          onPress={() => setTab("id")}
        >
          <Text style={[styles.tabText, tab === "id" && styles.tabTextActive]}>ID 찾기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "pw" && styles.tabBtnActive]}
          onPress={() => setTab("pw")}
        >
          <Text style={[styles.tabText, tab === "pw" && styles.tabTextActive]}>비밀번호 찾기</Text>
        </TouchableOpacity>
      </View>

      {tab === "id" ? (
        <View style={styles.formBox}>
          <Text style={styles.label}>이름</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="이름을 입력하세요"
            placeholderTextColor="#aaa"
          />
          <Text style={styles.label}>전화번호</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="전화번호를 입력하세요"
            keyboardType="phone-pad"
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity style={styles.actionBtn} onPress={handleFindId}>
            <Text style={styles.actionBtnText}>ID 찾기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.formBox}>
          <Text style={styles.label}>이메일</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="이메일을 입력하세요"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity style={styles.actionBtn} onPress={handleFindPw}>
            <Text style={styles.actionBtnText}>임시 비밀번호 전송</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
  },
  tabWrap: {
    flexDirection: "row",
    marginBottom: 24,
    marginTop: 24,
    justifyContent: "center",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#eee",
    alignItems: "center",
  },
  tabBtnActive: {
    borderBottomColor: "#7bb6fa",
  },
  tabText: {
    fontSize: 16,
    color: "#888",
    fontWeight: "bold",
  },
  tabTextActive: {
    color: "#7bb6fa",
  },
  formBox: {
    marginTop: 16,
  },
  label: {
    fontSize: 15,
    color: "#888",
    marginTop: 10,
    marginBottom: 2,
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
  actionBtn: {
    backgroundColor: "#7bb6fa",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  backButton: {
    position: 'absolute',
    top: 45,
    left: 5,
    zIndex: 10,
    padding: 8,
  },
});