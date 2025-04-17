import 'react-native-gesture-handler';
import React, { useState, useRef, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { CameraView, CameraType, useCameraPermissions, Camera } from 'expo-camera';
import { DeviceMotion } from 'expo-sensors';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { API_URL } from '../../constants/config';

const OnCamera: React.FC = () => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [recentPhoto, setRecentPhoto] = useState<string | null>(null);

  // Level sensor state: pitch only (front-back tilt)
  const [pitch, setPitch] = useState(0);

  const cameraRef = useRef<CameraView | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        console.warn('카메라 권한이 거부되었습니다.');
        return;
      }
      try {
        const response = await fetch(`${API_URL}/gallery/latest-photo`);
        const data = await response.json();
        if (data.contour_path) setRecentPhoto(data.contour_path);
      } catch {
        setRecentPhoto(null);
      }
    })();

    DeviceMotion.setUpdateInterval(100);
    const subscription = DeviceMotion.addListener(({ rotation }) => {
      setPitch(rotation.beta || 0);
    });
    return () => subscription.remove();
  }, []);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>카메라에 접근하려면 권한이 필요합니다.</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo?.uri) {
        const formData = new FormData();
        formData.append('file', { uri: photo.uri, name: `photo_${Date.now()}.jpg`, type: 'image/jpeg' } as any);
        const res = await fetch(`${API_URL}/act_camera/upload`, {
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log(await res.json());
      }
    } catch (e) {
      console.error('사진 촬영 또는 업로드 실패:', e);
    }
  };

  // Convert to degrees for pitch
  const pitchDeg = (pitch * 180) / Math.PI;

  // Level detection: allow vertical (0°) or top-down (90°)
  const thresholdDeg = 2;
  const targets = [0, 90];
  const pitchLevel = targets.some((t) => Math.abs(Math.abs(pitchDeg) - t) < thresholdDeg);

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('index' as never)}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.controlContainer}>
            <TouchableOpacity style={styles.switchButton} onPress={() => setFacing((f) => f === 'back' ? 'front' : 'back')}>
              <Ionicons name="camera-reverse" size={30} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.innerCircle} />
            </TouchableOpacity>
            {recentPhoto && (
              <TouchableOpacity style={styles.galleryButton} onPress={() => navigation.navigate('gallery' as never)}>
                <Image source={{ uri: recentPhoto }} style={styles.thumbnail} />
              </TouchableOpacity>
            )}
          </View>
        </CameraView>

        {/* Vertical level line for pitch */}
        <View
          style={[
            styles.vertLine,
            {
              transform: [{ rotate: `${pitchDeg}deg` }],
              backgroundColor: pitchLevel ? '#00FF00AA' : '#FF0000AA',
            },
          ]}
        />
        <Text style={styles.levelText}>Pitch: {pitchDeg.toFixed(1)}°</Text>
      </View>
    </View>
  );
};

export default OnCamera;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraContainer: { flex: 1, position: 'relative' },
  camera: { flex: 1, width: '100%', height: '100%' },
  headerButton: { position: 'absolute', top: 50, left: 10, zIndex: 20, padding: 8 },
  controlContainer: { position: 'absolute', bottom: 20, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#ddd', position: 'absolute', bottom: 20 },
  innerCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ff0000' },
  switchButton: { position: 'absolute', bottom: 20, right: 20, width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  galleryButton: { position: 'absolute', bottom: 20, left: 20, width: 60, height: 60, borderRadius: 10, overflow: 'hidden', borderWidth: 2, borderColor: '#fff' },
  thumbnail: { width: '100%', height: '100%' },
  vertLine: { position: 'absolute', left: '50%', top: 40, bottom: 40, width: 4, borderRadius: 2, zIndex: 30 },
  levelText: { position: 'absolute', top: 40, alignSelf: 'center', color: '#fff', fontSize: 14, zIndex: 30 },
  message: { textAlign: 'center', paddingBottom: 10, color: '#fff' },
});
