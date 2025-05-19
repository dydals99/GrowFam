import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL } from '../../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function CommunityWrite() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [userNo, setUserNo] = useState<number | null>(null);

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserNo = async () => {
      try {
        const userNo = await AsyncStorage.getItem("user_no");
        if (!userNo) {
          Alert.alert("로그인이 필요합니다.");
          router.replace("/users/login");
          return;
        }
        setUserNo(Number(userNo));
      } catch (error) {
        console.error("오류 발생:", error);
        Alert.alert("사용자 정보를 가져오는 중 오류가 발생했습니다.");
      }
    };
    fetchUserNo();
  }, []);

  const handleSubmit = async () => {
    if (!title || !content) {
      Alert.alert('Error', '제목과 내용을 입력해주세요.');
      return;
    }
    if (!userNo) {
      Alert.alert('Error', '로그인이 필요합니다.');
      return;
    }
    const postData = {
      community_title: title,
      community_content: content,
      user_no: userNo,
    };
    try {
      const res = await fetch(`${API_URL}/communities/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error('글 등록 실패:', res.status, errText);
        Alert.alert('글 등록에 실패했습니다.');
        return;
      }
      const data = await res.json();
      Alert.alert('글이 등록되었습니다.');
      setTitle('');
      setContent('');
      router.replace({
        pathname: '/community/communityDetail',
        params: { post: JSON.stringify(data) },
      });
    } catch (error) {
      console.error('네트워크 오류:', error);
      Alert.alert('네트워크 오류가 발생했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 바 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('./community')}>
          <Text style={styles.headerIcon}>✕</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.headerSubmit} onPress={handleSubmit}>
          <Text style={styles.headerSubmitText}>등록</Text>
        </TouchableOpacity>
      </View>

      {/* 제목 입력 */}
      <View style={styles.titleBox}>
        <TextInput
          style={styles.titleInput}
          placeholder="제목"
          placeholderTextColor="#bbb"
          value={title}
          onChangeText={setTitle}
        />
      </View>
    
      {/* 툴바 (이미지 첨부 이모티콘) */}
      <View style={styles.toolbar}>
        <MaterialCommunityIcons name="image-plus" size={28} color="#888" />
      </View>

      {/* 내용 입력 */}
      <View style={styles.contentDivider} />
      <TextInput
        style={styles.contentInput}
        placeholder="내용을 입력하세요."
        placeholderTextColor="#bbb"
        value={content}
        onChangeText={setContent}
        multiline
      />
      <View style={styles.contentDivider} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerIcon: {
    fontSize: 24,
    color: '#222',
    marginRight: 12,
    width: 32,
    textAlign: 'center',
  },
  headerSubmit: {
    backgroundColor: '#b7d6bb',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSubmitText: {
    fontSize: 16,
    color: '#fff',
  },
  titleInput: {
    fontSize: 16,
    color: '#222',
    fontWeight: 'normal',
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  titleBox: {
    backgroundColor: '#f6f7f9',
    borderRadius: 8,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 4,
    paddingLeft:10
  },
  toolbarIcon: {
    fontSize: 22,
    marginHorizontal: 6,
    color: '#888',
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    textAlignVertical: 'top',
    color: '#222',
  },
  contentDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: 12,
    marginBottom: 0,
    marginTop: 4,
  },
});