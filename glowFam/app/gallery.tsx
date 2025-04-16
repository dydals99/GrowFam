import React, { useEffect, useState } from "react";
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, Modal, Dimensions } from "react-native";
import { API_URL } from '../constants/config'

const screenWidth = Dimensions.get("window").width;
const ITEM_MARGIN = 10;
const NUM_COLUMNS = 2;
const ITEM_WIDTH = (screenWidth - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

interface Photo {
  id: number; 
  file_name: string;
  contour_path?: string;  // user photo용
  file_path?: string;     // combined 이미지용
  type?: string;          // "user" 또는 "combined"
}

const GalleryScreen: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<number[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/gallery/photos`)  
      .then((response) => response.json())
      .then((data) => {
        console.log("받은 데이터:", data);
        setPhotos(data.photos);
      })
      .catch((error) => console.error("에러:", error));
  }, []);

  // 사진 선택 토글: 길게 누르면 선택/해제
  const toggleSelect = (id: number) => {
    setSelectedPhotoIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const combineSelectedPhotos = async () => {
    if (selectedPhotoIds.length === 0) {
      alert("합칠 사진을 선택해 주세요.\n(사진을 길게 눌러 선택하세요.)");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/gallery/combine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_ids: selectedPhotoIds }),
      });
      const data = await response.json();
      if (data.combined_image_url) {
        alert("사진이 성공적으로 합쳐졌습니다.");
        const newPhoto: Photo = {
          id: data.combine_image_no || Date.now(),
          file_name: "combined.jpg",
          file_path: data.combined_image_url,
          type: "combined"
        };
        setPhotos((prev) => [newPhoto, ...prev]);
        setSelectedPhotoIds([]);
      } else {
        alert("사진 합치기에 실패했습니다.");
      }
    } catch (error) {
      console.error("사진 합치기 오류:", error);
      alert("사진 합치기 오류가 발생했습니다.");
    }
  };

  const renderItem = ({ item }: { item: Photo }) => {
    const isSelected = selectedPhotoIds.includes(item.id);
    // user 사진은 contour_path, combined 사진은 file_path를 사용
    const imageUri = item.type === "combined" ? item.file_path : item.contour_path;
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedImage(imageUri || "");
          setModalVisible(true);
        }}
        onLongPress={() => toggleSelect(item.id)}
        style={styles.imageWrapper}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: imageUri || "" }} 
            style={styles.image} 
            onError={(error) => console.log("이미지 로드 실패:", error.nativeEvent)}
          />
          {isSelected && (
            <View style={styles.selectedOverlay}>
              <Text style={styles.selectedText}>✓</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 상단 헤더와 합치기 버튼 */}
      <View style={styles.header}>
        <Text style={styles.title}>갤러리</Text>
        <TouchableOpacity style={styles.combineButton} onPress={combineSelectedPhotos}>
          <Text style={styles.combineButtonText}>합치기</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={photos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.listContent}
      />

      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalContainer} 
          onPress={() => setModalVisible(false)}
          activeOpacity={1}
        >
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.fullImage} 
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  combineButton: {
    backgroundColor: "#58a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  combineButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  imageWrapper: {
    flex: 1,
    margin: 5,
  },
  imageContainer: {
    width: ITEM_WIDTH,
    height: 150,
    margin: ITEM_MARGIN / 2,
    borderRadius: 10,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  selectedOverlay: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: 25,
    height: 25,
    borderRadius: 12.5,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
});

export default GalleryScreen;
