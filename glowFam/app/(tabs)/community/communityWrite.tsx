import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL } from '../../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CommunityWrite() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [userNo, setUserNo] = useState<number | null>(null);

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserNo = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token'); 
        if (!token) {
          Alert.alert('로그인이 필요합니다.');
          router.replace('/users/login'); 
          return;
        }

        // 사용자 정보 요청
        const response = await fetch(`${API_URL}/users/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error('사용자 정보를 가져오는데 실패했습니다.');
          Alert.alert('사용자 정보를 가져오는 중 오류가 발생했습니다.');
          return;
        }

        const userData = await response.json();
        setUserNo(userData.user_no);
      } catch (error) {
        console.error('오류 발생:', error);
        Alert.alert('로그인 정보를 가져오는 중 오류가 발생했습니다.');
      }
    };

    fetchUserNo();
  }, []);

  const handleCancel = () => {
    router.push('./community');
  };

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
      console.log('등록 성공:', data);
      Alert.alert('글이 등록되었습니다.');
  
      // 제목과 내용 초기화
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
    <View style={styles.container}>
      <Text style={styles.title}>글 작성</Text>
      <TextInput
        placeholder="제목"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <TextInput
        placeholder="내용"
        value={content}
        onChangeText={setContent}
        style={[styles.input, { height: 280 }]}
        multiline
      />
      <View style={styles.buttonRow}>
        <Button title="취소" onPress={handleCancel} color="#888" />
        <Button title="등록" onPress={handleSubmit} color="#4CAF50" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 70, paddingLeft: 20, paddingRight: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});