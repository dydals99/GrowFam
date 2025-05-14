import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API_URL } from '../../../constants/config';

const CommunityComentEdit = () => {
  const router = useRouter();
  const { coment_no, coment_content, user_nickname, user_no, community_no } = useLocalSearchParams<{
    coment_no: string;
    coment_content: string;
    user_nickname: string;
    user_no: string;
    community_no: string;
  }>();

  const [updatedComent, setUpdatedComent] = useState(coment_content || '');

  useEffect(() => {
    if (coment_content) {
      setUpdatedComent(coment_content);
    }
  }, [coment_content]);

  const handleUpdateComent = async () => {
  if (!updatedComent.trim()) {
    Alert.alert('오류', '댓글 내용을 입력하세요.');
    return;
  }

    try {
      const res = await fetch(`${API_URL}/coments/${coment_no}`, {
        method: 'PUT', // FastAPI 엔드포인트와 일치하는 메서드 사용
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coment_content: updatedComent,
        }),
      });

      if (res.ok) {
        const updatedData = await res.json();
        
        Alert.alert('성공', '댓글이 수정되었습니다.', [
          {
            text: '확인',
            onPress: () =>
              router.push({
                pathname: '/community/communityComent',
                params: {
                communityNo: updatedData.community_no,
                userNo: updatedData.user_no,
                comentNo: updatedData.coment_no,
                comentContent: updatedData.coment_content,
                
              },
              }),
          },
        ]);
      } else {
        console.error('댓글 수정 실패:', res.status);
        Alert.alert('오류', '댓글 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 수정 요청 에러:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>댓글 수정</Text>
      <Text style={styles.label}>작성자: {user_nickname}</Text>
      <TextInput
        style={styles.input}
        value={updatedComent}
        onChangeText={setUpdatedComent}
        placeholder="댓글 내용을 입력하세요..."
        multiline
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleUpdateComent}>
          <Text style={styles.buttonText}>수정</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() =>
            router.push({ 
              pathname: './communityComent', 
              params: { communityNo: community_no, userNo: user_no } })
          }
        >
          <Text style={styles.buttonText}>취소</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 70,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CommunityComentEdit;