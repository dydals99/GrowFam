import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API_URL } from '../../../constants/config';

export default function CommunityEdit() {
  const router = useRouter();
  const params = useLocalSearchParams<{ post?: string }>();
  const post = params.post ? JSON.parse(params.post) : null;

  // 기존 데이터로 초기값 설정
  const [title, setTitle] = useState(post ? post.community_title : '');
  const [content, setContent] = useState(post ? post.community_content : '');

  const handleCancel = () => {
    // 취소 시 목록 페이지로 이동합니다.
    router.push('./community');
  };

  const handleSubmit = async () => {
    if (!title || !content) {
      Alert.alert('알림', '제목과 내용을 입력해주세요.');
      return;
    }

    const postData = {
      community_title: title,
      community_content: content,
      // 필요한 경우 user_no 등 다른 필드도 추가할 수 있습니다.
    };

    try {
      const res = await fetch(`${API_URL}/communities/${post.community_no}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('글 수정 실패:', res.status, errText);
        Alert.alert('오류', '글 수정에 실패했습니다.');
        return;
      }

      const data = await res.json();
      console.log('수정 성공:', data);
      Alert.alert('알림', '글이 수정되었습니다.');
      router.replace({
        pathname: '/community/communityDetail',
        params: { post: JSON.stringify(data) },
      });
    } catch (error) {
      console.error('네트워크 오류:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    }
  };

  // 만약 post 데이터가 없다면 에러 메시지 출력
  if (!post) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>수정할 게시글 정보를 찾을 수 없습니다.</Text>
        <Button title="뒤로가기" onPress={handleCancel} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>글 수정</Text>
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
        <Button title="수정" onPress={handleSubmit} color="#4CAF50" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingTop: 70, 
    paddingLeft: 20, 
    paddingRight: 20, 
    backgroundColor: '#fff' 
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 16 
  },
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
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    marginBottom: 16,
  },
});
