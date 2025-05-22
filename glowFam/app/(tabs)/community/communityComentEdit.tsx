import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
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
        method: 'PUT',
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
                },
              }),
          },
        ]);
      } else {
        Alert.alert('오류', '댓글 수정에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 상단 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>댓글 수정</Text>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/community/communityComent',
                params: { communityNo: community_no, userNo: user_no },
              })
            }
          >
            <Text style={styles.headerIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* 작성자 정보 */}
        <Text style={styles.label}>작성자: {user_nickname}</Text>

        {/* 댓글 입력 영역 */}
        <View style={styles.commentInputWrap}>
          <TextInput
            style={styles.commentRealInput}
            value={updatedComent}
            onChangeText={setUpdatedComent}
            placeholder="댓글 내용을 입력하세요..."
            placeholderTextColor="#bbb"
            multiline
            maxLength={1000}
          />
          <View style={styles.commentInputBottomRow}>
            <View style={{ flex: 1 }} />
            <Text style={styles.commentLength}>{updatedComent.length}/1000</Text>
            <TouchableOpacity
              style={styles.commentCancelBtn}
              onPress={() =>
                router.push({
                  pathname: '/community/communityComent',
                  params: { communityNo: community_no, userNo: user_no },
                })
              }
            >
              <Text style={styles.commentCancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.commentSubmitBtn,
                !updatedComent.trim() && styles.commentSubmitBtnDisabled,
              ]}
              onPress={handleUpdateComent}
              disabled={!updatedComent.trim()}
            >
              <Text
                style={[
                  styles.commentSubmitText,
                  !updatedComent.trim() && styles.commentSubmitTextDisabled,
                ]}
              >
                수정
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 70,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerIcon: {
    fontSize: 22,
    color: '#222',
    padding: 4,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 16,
  },
  commentInputWrap: {
    backgroundColor: '#f6f7f9',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    margin: 12,
    marginBottom: 0,
  },
  commentRealInput: {
    backgroundColor: 'transparent',
    fontSize: 16,
    color: '#222',
    minHeight: 28,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  commentInputBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  commentLength: {
    color: '#bbb',
    fontSize: 13,
    marginRight: 8,
  },
  commentCancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f3f3f3',
    marginRight: 6,
  },
  commentCancelText: {
    color: '#888',
    fontSize: 15,
  },
  commentSubmitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#b7d6bb',
  },
  commentSubmitBtnDisabled: {
    backgroundColor: '#e0e0e0',
  },
  commentSubmitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  commentSubmitTextDisabled: {
    color: '#000',
  },
});

export default CommunityComentEdit;