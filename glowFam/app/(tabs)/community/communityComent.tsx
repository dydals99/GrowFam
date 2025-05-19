import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity,SafeAreaView, TextInput, Button, StyleSheet, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API_URL } from '../../../constants/config';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const CommunityComent = () => {
  const router = useRouter();
  const { communityNo, userNo } = useLocalSearchParams<{ communityNo: string; userNo: string }>();
  const [coments, setComents] = useState([]);
  const [newComent, setNewComent] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

  // 댓글 목록 가져오기
  const fetchComents = async () => {
    try {
      const res = await fetch(`${API_URL}/coments/list?community_no=${communityNo}`);
      if (res.ok) {
        const data = await res.json();
        setComents(data);
      } else {
        console.error('댓글 목록 로드 실패:', res.status);
        Alert.alert('오류', '댓글 목록을 불러오는 데 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 목록 요청 에러:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    }
  };

  // 페이지 로드 시 댓글 목록 업데이트
  useEffect(() => {
    fetchComents();
  }, [communityNo]);

  const handleAddComent = async () => {
    if (!newComent.trim()) {
      Alert.alert('오류', '댓글 내용을 입력하세요.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/coments/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coment_content: newComent,
          community_no: communityNo,
          user_no: userNo,
        }),
      });

      if (res.ok) {
        Alert.alert('성공', '댓글이 등록되었습니다.');
        setNewComent('');
        fetchComents(); // 댓글 등록 후 목록 업데이트
      } else {
        console.error('댓글 등록 실패:', res.status);
        Alert.alert('오류', '댓글 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 등록 요청 에러:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.comentContainer}>
      <Text style={styles.comentTitle}>{item.coment_content}</Text>
      <Text style={styles.comentAuthor}>작성자: {item.user_nickname}</Text>
      <Text style={styles.comentDate}>등록일자: {new Date(item.coment_regist_at).toLocaleString()}</Text>
      {item.user_no === Number(userNo) && ( // 조건부 렌더링
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => {
              router.push({
                pathname: '/community/communityComentEdit',
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
            style={styles.deleteButton}
            onPress={async () => {
              try {
                const res = await fetch(`${API_URL}/coments/${item.coment_no}`, {
                  method: 'DELETE',
                });
                if (res.ok) {
                  Alert.alert('성공', '댓글이 삭제되었습니다.');
                  fetchComents(); // 댓글 삭제 후 목록 업데이트
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* X(뒤로가기) 버튼 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("./community")}>
            <Text style={styles.headerIcon}>✕</Text>
          </TouchableOpacity>
        </View>
        {/* 댓글 입력 영역 */}
        <View style={styles.commentInputWrap}>
          <View style={styles.commentInputInner}>
            <View style={{ flex: 1 }}>
              {!inputFocused ? (
                <TouchableOpacity
                  style={styles.commentFakeInput}
                  onPress={() => setInputFocused(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.commentFakeInputText}>댓글을 남겨보세요.</Text>
                </TouchableOpacity>
              ) : (
                <View>
                  <TextInput
                    style={styles.commentRealInput}
                    value={newComent}
                    onChangeText={setNewComent}
                    placeholder="댓글을 남겨보세요."
                    placeholderTextColor="#bbb"
                    autoFocus
                    multiline
                    maxLength={6000}
                  />
                  <View style={styles.commentInputBottomRow}>
                    <MaterialCommunityIcons name="emoticon-outline" size={24} color="#bbb" style={{ marginRight: 8 }} />
                    <MaterialCommunityIcons name="camera-outline" size={24} color="#bbb" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }} />
                    <Text style={styles.commentLength}>{newComent.length}/6000</Text>
                    <TouchableOpacity
                      style={styles.commentCancelBtn}
                      onPress={() => {
                        setInputFocused(false);
                        setNewComent('');
                      }}
                    >
                      <Text style={styles.commentCancelText}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.commentSubmitBtn,
                        !newComent.trim() && styles.commentSubmitBtnDisabled,
                      ]}
                      onPress={() => {
                        if (newComent.trim()) {
                          setInputFocused(false);
                          handleAddComent();
                        }
                      }}
                      disabled={!newComent.trim()}
                    >
                      <Text
                        style={[
                          styles.commentSubmitText,
                          !newComent.trim() && styles.commentSubmitTextDisabled,
                        ]}
                      >
                        등록
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* 댓글 목록 */}
        <FlatList
          data={coments}
          keyExtractor={(item) => item.coment_no.toString()}
          renderItem={renderItem}
          onRefresh={fetchComents}
          refreshing={false}
          contentContainerStyle={{ flexGrow: 1 }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="dots-horizontal-circle-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>등록된 댓글이 없습니다.</Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerIcon: {
    fontSize: 24,
    color: '#222',
    width: 32,
    textAlign: 'center',
  },
  commentInputWrap: {
    backgroundColor: '#f6f7f9',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    margin: 12,
    marginBottom: 0,
  },
  commentInputInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentFakeInput: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    minHeight: 28,
    justifyContent: 'center',
  },
  commentFakeInputText: {
    color: '#bbb',
    fontSize: 16,
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
    color: '#bbb',
  },
  comentContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  comentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  comentAuthor: {
    fontSize: 14,
    marginBottom: 4,
  },
  comentDate: {
    fontSize: 12,
    color: '#555',
    marginBottom: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  updateButton: {
    marginRight: 8,
    padding: 8,
    backgroundColor: '#b7d6bb',
    borderRadius: 4,
  },
  deleteButton: {
    marginRight: 8,
    padding: 8,
    backgroundColor: '#ddd',
    borderRadius: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#bbb',
    fontSize: 16,
    marginTop: 8,
  },
});

export default CommunityComent;