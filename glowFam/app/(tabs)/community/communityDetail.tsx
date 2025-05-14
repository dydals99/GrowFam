import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TouchableWithoutFeedback, Keyboard, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_URL } from '../../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

type Post = {
  community_no: number;
  community_title: string;
  community_content: string;
  community_regist_at: string;
  user_no: number;
  user_nickname: string;
};

type Coment = {
  coment_no: number;
  coment_content: string;
  user_nickname: string;
  coment_regist_at: string;
};

export default function CommunityDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ post?: string }>();
  const [modalVisible, setModalVisible] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [comentCounts, setComentCounts] = useState<number>(0);
  const [userNo, setUserNo] = useState<number | null>(null); // 로그인한 사용자의 user_no
  const [coments, setComents] = useState<Coment[]>([]);
  const [loadingComents, setLoadingComents] = useState<boolean>(false);

  const post: Post | undefined = params.post ? JSON.parse(params.post) : undefined;

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserNo = async () => {
      try {
        const userNo = await AsyncStorage.getItem("user_no"); // AsyncStorage에서 user_no 가져오기
        if (!userNo) {
          Alert.alert("로그인이 필요합니다.");
          router.replace("/users/login"); // 로그인 화면으로 이동
          return;
        }

        setUserNo(Number(userNo)); // userNo를 상태로 설정
      } catch (error) {
        console.error("오류 발생:", error);
        Alert.alert("사용자 정보를 가져오는 중 오류가 발생했습니다.");
      }
    };

    fetchUserNo();
  }, []);

  useEffect(() => {
    if (post) {
      fetchLikeStatus();
      fetchComentCount();
    }
  }, [post]);

  const fetchLikeStatus = async () => {
    try {
      const res = await fetch(
        `${API_URL}/community-likes/status?community_no=${post?.community_no}&user_no=${userNo}`
      );
      const data = await res.json();
      setHasLiked(data.liked);
      setLikeCount(data.count);
    } catch (error) {
      console.error('좋아요 상태 불러오기 실패:', error);
      Alert.alert('오류', '좋아요 상태를 불러오는데 실패했습니다.');
    }
  };

  const fetchComentCount = async () => {
    if (!post) return;
    try {
      const res = await fetch(`${API_URL}/coments/counts?community_no=${post.community_no}`);
      if (!res.ok) {
        throw new Error('잘못된 요청');
      }
      const data = await res.json();
      if (data && data.counts) {
        const count = data.counts[post.community_no] || 0; // 댓글이 없으면 0으로 설정
        setComentCounts(count);
      } else {
        console.error('예상 못한 API 응답:', data);
      }
    } catch (error) {
      console.error('fetching 에러 :', error);
    }
  };

  const toggleLike = async () => {
    try {
      const res = await fetch(
        `${API_URL}/community-likes/toggle/${post?.community_no}/like?user_no=${userNo}`,
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

  const handleEdit = async () => {
    try {
      if (!post) {
        throw new Error('Post data is undefined');
      }
      const response = await fetch(`${API_URL}/communities/${post.community_no}`);
      if (!response.ok) {
        throw new Error('Failed to fetch community details');
      }
      const communityData = await response.json();
      router.push({
        pathname: '/community/communityEdit',
        params: { post: JSON.stringify(communityData) },
      });
    } catch (error) {
      console.error('Error fetching community details:', error);
      Alert.alert('오류', '수정할 데이터를 불러오는데 실패했습니다.');
    }
  };

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
        const errorData = await res.json();
        console.error('삭제 실패:', errorData);
        Alert.alert('오류', '게시글 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 요청 에러:', error);
      Alert.alert('오류', '게시글 삭제 요청 도중 에러가 발생했습니다.');
    }
  };

  const handleOutsidePress = () => {
    setShowMoreMenu(false);
    Keyboard.dismiss();
  };

  const handleGoList = () => {
    router.push('./community');
  };

  const fetchComents = async () => {
    if (!post) return;
    setLoadingComents(true);
    try {
      const res = await fetch(`${API_URL}/coments/list?community_no=${post.community_no}`);
      if (res.ok) {
        const data = await res.json();
        const formattedComents = data.map((coment: any) => ({
          id: coment.coment_no,
          text: coment.coment_content,
          user_nickname: coment.user_nickname,
          coment_at: coment.coment_at,
          user_id: coment.user_no,
        }));
        setComents(formattedComents);
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
              {userNo === post?.user_no && (
              <Text style={styles.moreButtonText}>⋮</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 점 세개 클릭 → 수정/삭제 메뉴 */}
        {showMoreMenu && userNo === post?.user_no && ( 
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
          <Text style={styles.author}>작성자 : {post.user_nickname}</Text>
          <Text style={styles.date}>
            작성일 :{" "}
            {post.community_regist_at || dayjs(post.community_regist_at).isValid()
              ? dayjs(post.community_regist_at).format("YYYY.MM.DD HH:mm")
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
              onPress={() => router.push(`/community/communityComent?communityNo=${post.community_no}&userNo=${userNo}`)}
            >
              <Text style={styles.iconText}>💬 {comentCounts || 0}</Text>
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
