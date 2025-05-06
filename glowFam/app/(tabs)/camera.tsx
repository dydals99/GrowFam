import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { API_URL } from '../../constants/config';
import { DeviceMotion } from 'expo-sensors';

const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [step, setStep] = useState<'askSize' | 'capture' | 'result'>('askSize');
  const [shoeSize, setShoeSize] = useState('');
  const [annotatedUri, setAnnotatedUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const cameraRef = useRef<CameraView | null>(null);
  const [pitch, setPitch] = useState(0); // 위아래 기울기

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    // DeviceMotion 구독
    const subscription = DeviceMotion.addListener((motionData) => {
      const { accelerationIncludingGravity } = motionData;
      const { x, y, z } = accelerationIncludingGravity;

      // 핸드폰이 세워진 상태에서의 수직 기울기 계산 (상하 반전 적용)
      const adjustedPitch = Math.atan2(z, -y) * (180 / Math.PI); // z와 y의 부호를 반전

      setPitch(adjustedPitch); // 보정된 pitch 값 설정
    });

    // 업데이트 속도 설정
    DeviceMotion.setUpdateInterval(100); // 100ms마다 업데이트

    return () => subscription.remove(); // 컴포넌트 언마운트 시 구독 해제
  }, []);

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync();
    if (!photo?.uri) throw new Error('사진을 촬영하지 못했습니다.');
    return await ImageManipulator.manipulateAsync(
      photo.uri,
      [{ resize: { width: 640 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
  };

  const handleNext = async () => {
    try {
      if (step === 'askSize') {
        if (!shoeSize || isNaN(+shoeSize)) {
          Alert.alert('오류', '유효한 신발 사이즈를 입력해주세요.');
          return;
        }
        setStep('capture');
      } else if (step === 'capture') {
        setIsLoading(true);
        const img = await takePhoto();
        if (!img) {
          Alert.alert('오류', '사진 촬영에 실패했습니다.');
          setIsLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('shoe_size', shoeSize.toString());
        formData.append('image', {
          uri: img.uri,
          name: 'capture.jpg',
          type: 'image/jpeg',
        } as any);

        const response = await fetch(`${API_URL}/estimate-height`, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();

        if (data.success) {
          setResultMessage(`추정 키: ${data.height_cm.toFixed(1)} cm`);
          setAnnotatedUri(`data:image/jpeg;base64,${data.annotated_image}`);
        } else {
          setResultMessage('키 추정에 실패했습니다.');
        }

        setStep('result');
        setIsLoading(false);
      } else if (step === 'result') {
        setShoeSize('');
        setAnnotatedUri(null);
        setResultMessage('');
        setStep('askSize');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('오류', '처리 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  if (hasPermission === null) return <View />;
  if (hasPermission === false) return <Text>카메라 권한이 필요합니다.</Text>;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {step === 'askSize' && (
          <View style={styles.overlay}>
            <Text style={styles.prompt}>신발 사이즈를 입력해주세요 (cm):</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="예: 260"
              value={shoeSize}
              onChangeText={setShoeSize}
            />
          </View>
        )}

        {step === 'capture' && (
          <View style={styles.cameraContainer}>
            <CameraView ref={cameraRef} style={styles.camera} />
            {/* 수직선 오버레이 */}
            <View style={styles.overlay}>
              <View
                style={[
                  styles.verticalLine,
                  { backgroundColor: Math.abs(pitch) > 10 ? 'red' : 'green' },
                ]}
              />
            </View>
          </View>
        )}

        {step === 'result' && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>{resultMessage}</Text>
            {annotatedUri && (
              <Image
                source={{ uri: annotatedUri }}
                style={styles.fullPreview}
              />
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {step === 'askSize' && '다음'}
            {step === 'capture' && '촬영 및 측정'}
            {step === 'result' && '다시 시작'}
          </Text>
        </TouchableOpacity>

        {isLoading && <ActivityIndicator size="large" color="#fff" />}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center', // 수평선이 화면 중앙에 위치하도록 설정
    alignItems: 'center',
  },
  verticalLine: {
    height: '90%', // 화면 높이의 90%
    width: 3, // 선의 두께
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // 반투명 흰색
  },
  prompt: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: '#1E90FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: { color: '#fff', fontSize: 16 },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultText: {
    color: '#fff',
    fontSize: 22,
    marginBottom: 16,
  },
  fullPreview: {
    width: '90%',
    height: '60%',
    resizeMode: 'contain',
    marginTop: 16,
  },
});

export default CameraScreen;