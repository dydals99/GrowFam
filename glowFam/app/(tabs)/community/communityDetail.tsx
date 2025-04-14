import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TouchableWithoutFeedback, Keyboard, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import CommunityCommentModal from './communityComent';
import { API_URL } from '../../../constants/config';
import dayjs from 'dayjs';

type Post = {
  community_no: number;
  community_title: string;
  community_content: string;
  user_no: number;
  community_created_at: string;
};

const mockUser = {
  user_no: 1,
};

export default function CommunityDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ post?: string }>();
  const [modalVisible, setModalVisible] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [comentCount, setComentCount] = useState<number>(0);
  type Coment = {
    id: number;
    text: string;
    user_nickname: string;
    coment_at: string;
  };
  
  const [coments, setComents] = useState<Coment[]>([]);
  const [loadingComments, setLoadingComents] = useState<boolean>(false);

  const post: Post | undefined = params.post ? JSON.parse(params.post) : undefined;

  useEffect(() => {
    if (post) {
      fetchLikeStatus();
      // 댓글 수도 서버에서 받아오려면 setCommentCount(...)
    }
  }, [post]);

  useEffect(() => {
    if (!post) {
      //console.error('post 데이터가 전달되지 않았습니다. params:', params);
    }
  }, [params]);

  const fetchLikeStatus = async () => {
    try {
      const res = await fetch(
        `${API_URL}/community-likes/status?community_no=${post?.community_no}&user_no=${mockUser.user_no}`
      );
      const data = await res.json();
      setHasLiked(data.liked);
      setLikeCount(data.count);
    } catch (error) {
      console.error('좋아요 상태 불러오기 실패:', error);
      Alert.alert('오류', '좋아요 상태를 불러오는데 실패했습니다.');
    }
  };

  // 좋아요 토글
  const toggleLike = async () => {
    try {
      const res = await fetch(
        `${API_URL}/community-likes/toggle/${post?.community_no}/like?user_no=${mockUser.user_no}`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (data.action === 'unliked') {
        setHasLiked(false);
      } else if (data.action === 'liked') {
        setHasLiked(true);
      }
      setLikeCount(data.like_count);
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
      Alert.alert('오류', '좋아요 업데이트에 실패했습니다.');
    }
  };

  const handleEdit = () => {
    setShowMoreMenu(false);
    router.push({
    pathname: '/community/communityEdit',
    params: { post: JSON.stringify(post) },
    });
  };
  // 삭제하기
  const handleDelete = async () => {
    setShowMoreMenu(false);
    try {
      const res = await fetch(`${API_URL}/communities/${post?.community_no}`, {
        method: 'DELETE',
      });
  
      if (res.status === 204) {
        Alert.alert('알림', '게시글이 삭제되었습니다.');
        router.push('./community');
      } else {
        // 204가 아닌 경우 에러 메시지 처리
        const errorData = await res.json();
        console.error('삭제 실패:', errorData);
        Alert.alert('오류', '게시글 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 요청 에러:', error);
      Alert.alert('오류', '게시글 삭제 요청 도중 에러가 발생했습니다.');
    }
  };

  // 외부 터치 시 (메뉴 닫힘)
  const handleOutsidePress = () => {
    setShowMoreMenu(false);
    Keyboard.dismiss();
  };

  // 목록으로 이동
  const handleGoList = () => {
    router.push('./community');
  };

  const fetchComents = async () => {
    if (!post) return;
    setLoadingComents(true);
    try {
      const res = await fetch(`${API_URL}/comments/list?community_no=${post.community_no}`);
      if (res.ok) {
        const data = await res.json();
        const formattedComments = data.map((comment: any) => ({
          id: comment.coment_no,
          text: comment.coment_content,
          user_nickname: comment.user_nickname,
          coment_at: comment.coment_at,
          user_id: comment.user_no,
        }));
        setComents(formattedComments);
      } else {
        console.error('댓글 불러오기 실패:', res.status);
        setComents([]);
      }
    } catch (error) {
      console.error('댓글 요청 에러:', error);
      setComents([]);
    } finally {
      setLoadingComents(false);
    }
  };

  useEffect(() => {
    if (modalVisible) {
      fetchComents();
    }
  }, [modalVisible]);

  if (!post) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>포스트 정보가 없습니다.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>뒤로가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <View style={styles.container}>
        {/* 상단 헤더 영역 */}
        <View style={styles.headerArea}>
          <Text style={styles.headerTitle}>GlowCommunity</Text>
          <TouchableOpacity style={styles.moreButton} onPress={() => setShowMoreMenu(!showMoreMenu)}>
            <Text style={styles.moreButtonText}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* 점 세개 클릭 → 수정/삭제 메뉴 */}
        {showMoreMenu && (
          <View style={styles.moreMenu}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
              <Text style={styles.menuItemText}>수정하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
              <Text style={styles.menuItemText}>삭제하기</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Text style={styles.title}>{post.community_title}</Text>
          <Text style={styles.author}>작성자 : {post.user_no}</Text>
          <Text style={styles.date}>
            작성일 :{" "}
            {post.community_created_at || dayjs(post.community_created_at).isValid()
              ? dayjs(post.community_created_at).format("YYYY.MM.DD HH:mm")
              : "날짜 정보 없음"}
          </Text>
          <TextInput
            value={post.community_content}
            editable={false}
            multiline={true}
            style={styles.bodyText}
          />
        </ScrollView>

        <View style={styles.footerContainer}>
          <TouchableOpacity style={styles.footerLeft} onPress={handleGoList}>
            <Text style={styles.footerMenuIcon}>≡</Text>
            <Text style={styles.footerMenuText}>목록으로</Text>
          </TouchableOpacity>

          <View style={styles.footerRight}>
            <TouchableOpacity style={styles.iconButton} onPress={toggleLike}>
              <Text style={styles.iconText}>
                {hasLiked ? "❤️" : "🤍"} {likeCount}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { marginLeft: 25 }]}
              onPress={() => router.push(`/community/communityComent?communityNo=${post.community_no}&userNo=${mockUser.user_no}`)}
            >
              <Text style={styles.iconText}>💬 {comentCount}</Text>
            </TouchableOpacity>
          </View>
        </View>  
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 70,
    backgroundColor: "#b7d6bb",
  },
  headerArea: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "#b7d6bb",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  moreButton: {
    padding: 8,
  },
  moreButtonText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  moreMenu: {
    position: "absolute",
    top: 105,
    right: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    zIndex: 100,
  },
  menuItem: {
    padding: 12,
  },
  menuItemText: {
    fontSize: 16,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  author: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: "#333",
    marginBottom: 16,
  },
  bodyContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  bodyText: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    backgroundColor: "#f9f9f9",
    textAlignVertical: "top", 
    minHeight: 410,
  },
  footerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", 
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    backgroundColor: "#fff",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerMenuIcon: {
    fontSize: 24,
    color: "#4CAF50",
    fontWeight: "bold",
    marginRight: 8,
  },
  footerMenuText: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    paddingHorizontal: 8,
  },
  iconText: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  errorText: {
    marginTop: 100,
    fontSize: 16,
    textAlign: "center",
    color: "#333",
  },
});
