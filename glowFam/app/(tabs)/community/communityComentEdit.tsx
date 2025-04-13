import React, { useState } from 'react';
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

  const [updatedComment, setUpdatedComment] = useState(coment_content || '');

  const handleUpdateComment = async () => {
    if (!updatedComment.trim()) {
      Alert.alert('오류', '댓글 내용을 입력하세요.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/comments/${coment_no}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coment_content: updatedComment,
          coment_at: new Date().toISOString(), // 수정일 업데이트
        }),
      });

      if (res.ok) {
        const updatedData = await res.json(); // 수정된 데이터 가져오기
        Alert.alert('성공', '댓글이 수정되었습니다.', [
          {
            text: '확인',
            onPress: () =>
              router.push({
                pathname: './communityComent',
                params: { communityNo: community_no, userNo: user_no }, // communityNo와 userNo 전달
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
        value={updatedComment}
        onChangeText={setUpdatedComment}
        placeholder="댓글 내용을 입력하세요..."
        multiline
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleUpdateComment}>
          <Text style={styles.buttonText}>수정</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() =>
            router.push({ pathname: './communityComent', params: { communityNo: community_no, userNo: user_no } }) // 취소 시 communityNo와 userNo 전달
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