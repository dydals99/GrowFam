import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useRouter} from 'expo-router';
import { API_URL } from '../../../constants/config'

export default function CommunityWrite() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  // const [user_no, setUser_no] = useState('');

  const handleCancel = () => {
    router.push('./community'); 
  };

  const handleSubmit = async () => {
    if (!title || !content) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }
  
    const postData = {
      community_title: title, // 서버에서 기대하는 필드 이름으로 변경
      community_content: content, // 서버에서 기대하는 필드 이름으로 변경
      user_no: 2, 
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
        alert('글 등록에 실패했습니다.');
        return;
      }
  
      const data = await res.json();
      console.log('등록 성공:', data);
      alert('글이 등록되었습니다.');
  
      router.replace({
        pathname: '/community/communityDetail',
        params: { post: JSON.stringify(data) },
      });
    } catch (error) {
      console.error('네트워크 오류:', error);
      alert('네트워크 오류가 발생했습니다.');
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
  container: { flex: 1, paddingTop: 70, paddingLeft:20, paddingRight:20, backgroundColor: '#fff' },
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
