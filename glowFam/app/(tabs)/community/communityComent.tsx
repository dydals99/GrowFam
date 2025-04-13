import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Button, StyleSheet, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API_URL } from '../../../constants/config';

const CommunityComent = () => {
  const router = useRouter();
  const { communityNo, userNo, post } = useLocalSearchParams<{ communityNo: string; userNo: string; post: string }>();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_URL}/comments/list?community_no=${communityNo}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      } else {
        console.error('댓글 목록 로드 실패:', res.status);
        Alert.alert('오류', '댓글 목록을 불러오는 데 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 목록 요청 에러:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('오류', '댓글 내용을 입력하세요.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/comments/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coment_content: newComment,
          community_no: communityNo,
          user_no: userNo,
        }),
      });

      if (res.ok) {
        Alert.alert('성공', '댓글이 등록되었습니다.');
        setNewComment('');
        fetchComments();
      } else {
        console.error('댓글 등록 실패:', res.status);
        Alert.alert('오류', '댓글 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 등록 요청 에러:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    fetchComments();
  }, [communityNo]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.commentContainer}>
      <Text style={styles.commentTitle}>{item.coment_content}</Text>
      <Text style={styles.commentAuthor}>작성자: {item.user_nickname}</Text>
      <Text style={styles.commentDate}>등록일자: {new Date(item.coment_at).toLocaleString()}</Text>
      {item.user_no === Number(userNo) && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              console.log('Navigating to Edit with params:', {
                coment_no: item.coment_no,
                coment_content: item.coment_content,
                user_nickname: item.user_nickname,
                user_no: item.user_no,
                community_no: communityNo,
              });
              router.push({
                pathname: './communityComentEdit',
                params: {
                  coment_no: item.coment_no,
                  coment_content: item.coment_content,
                  user_nickname: item.user_nickname,
                  user_no: item.user_no,
                  community_no: communityNo,
                },
              });
            }}
          >
            <Text style={styles.actionButtonText}>수정</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={async () => {
              try {
                const res = await fetch(`${API_URL}/comments/${item.coment_no}`, {
                  method: 'DELETE',
                });
                if (res.ok) {
                  Alert.alert('성공', '댓글이 삭제되었습니다.');
                  fetchComments();
                } else {
                  Alert.alert('오류', '댓글 삭제에 실패했습니다.');
                }
              } catch (error) {
                Alert.alert('오류', '네트워크 오류가 발생했습니다.');
              }
            }}
          >
            <Text style={styles.actionButtonText}>삭제</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 상단 헤더 */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.push({
              pathname: './communityDetail',
              params: { communityNo, post: JSON.stringify(post) }, // post 데이터를 JSON 문자열로 전달
            })
          }
        >
          <Text style={styles.backButtonText}>뒤로가기</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>댓글 {comments.length}</Text>
      </View>

      {/* 댓글 입력 */}
      <View style={styles.addCommentContainer}>
        <TextInput
          style={styles.input}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="댓글을 남겨보세요."
        />
        <Button title="등록" onPress={handleAddComment} />
      </View>

      {/* 댓글 목록 */}
      <FlatList
        data={comments}
        keyExtractor={(item) => item.coment_no.toString()}
        renderItem={renderItem}
        onRefresh={fetchComments}
        refreshing={false}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#007BFF',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  commentContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 12,
    color: '#555',
    marginBottom: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    marginRight: 8,
    padding: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
  },
});

export default CommunityComent;
