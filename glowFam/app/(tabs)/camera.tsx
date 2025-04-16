import 'react-native-gesture-handler';
import { CameraView, CameraType, useCameraPermissions, Camera } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons'; 
import { API_URL } from '../../constants/config'


const OnCamera: React.FC = () => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [recentPhoto, setRecentPhoto] = useState<string | null>(null);
  
  const cameraRef = useRef<CameraView | null>(null);  
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== "granted") {
        console.warn("카메라 권한이 거부되었습니다.");
        return;
      }
      try {
        const response = await fetch(`${API_URL}/gallery/latest-photo`);
        const data = await response.json();
  
        if (data.contour_path) {
          setRecentPhoto(data.contour_path);
          console.log("최근 사진", data.contour_path);
        } else {
          console.warn("최근 사진이 없습니다.");
          setRecentPhoto(null);
        }
      } catch (error) {
        console.error("최근 사진 불러오기 오류:", error);
        setRecentPhoto(null);
      }
    })();
  }, []);

  if (!permission) {
    return <View/>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>카메라에 접근하려면 권한이 필요합니다.</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        
        if (photo && photo.uri) {
          const fileName = `photo_${Date.now()}.jpg`;
          const formData = new FormData();
          formData.append("file", {
            uri: photo.uri,
            name: fileName,
            type: "image/jpeg",
          } as any);

          const serverResponse = await fetch(`${API_URL}/act_camera/upload`, {
            method: 'POST',
            body: formData,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
      
          const data = await serverResponse.json();
          console.log("서버 응답:", data);
        }
      } catch (error) {
        console.error("사진 촬영 또는 업로드 실패:", error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate("index" as never)}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.switchCameraButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={30} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.innerCircle} />
            </TouchableOpacity>
            {recentPhoto && (
              <TouchableOpacity 
                style={styles.galleryButton} 
                onPress={() => navigation.navigate("gallery" as never)}>
                  <Image source={{ uri: recentPhoto }} style={styles.thumbnail} />
                  <Button title="Go to Gallery" onPress={() => navigation.navigate("gallery" as never)} />
              </TouchableOpacity>
            )}
          </View>
        </CameraView>
       
        <View style={styles.toeLine} />
      </View>
    </View>
  );
};

export default OnCamera;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  headerButton: {
    position: 'absolute',
    top: 50,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    zIndex: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ddd',
    position: 'absolute',
    bottom: 20,
  },
  innerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff0000',
  },
  switchCameraButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#fff",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  // 발끝 가이드 선 오버레이: 컨테이너 바깥쪽에 절대 위치로 배치
  toeLine: {
    position: 'absolute',
    bottom: 150, // 화면 하단에서 10px 위쪽
    left: 100,
    right: 100,
    height: 2,
    backgroundColor: '#00FF00',
    borderStyle: 'dashed',
    zIndex: 30,
  },
  message:{
    textAlign: 'center',
    paddingBottom: 10,
  }
});
