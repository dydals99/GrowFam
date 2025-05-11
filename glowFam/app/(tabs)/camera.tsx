
import 'react-native-gesture-handler';
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Image, Alert, Keyboard, TouchableWithoutFeedback, Button} from 'react-native';
import { Camera, CameraType, useCameraPermissions,CameraView } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { API_URL } from '../../constants/config';
import { DeviceMotion } from 'expo-sensors';

type Step = 'askHeight' | 'result';

const OnCamera: React.FC = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView | null>(null);
  const navigation = useNavigation();

  // 키 측정 상태
  const [step, setStep] = useState<Step>('askHeight');
  const [dadHeight, setDadHeight] = useState('');
  const [childHeight, setChildHeight] = useState<number | null>(null);
  const [annotUri, setAnnotUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pitch, setPitch] = useState<number | null>(null);

  // 타이머 상태
  const [timerOn, setTimerOn] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') console.warn('카메라 권한이 거부되었습니다.');
    })();

    // DeviceMotion 구독
     const subscription = DeviceMotion.addListener(({ rotation }) => {
      if (rotation?.beta != null) {
        const pitchDeg = (rotation.beta * 180) / Math.PI;
        const setVertical = Math.abs(pitchDeg - 90);
        setPitch(setVertical);;
      }
    });

    DeviceMotion.setUpdateInterval(200);

    return () => {
      subscription.remove();
    };
  }, []);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>카메라에 접근하려면 권한이 필요합니다.</Text>
        <Button onPress={requestPermission} title="권한 요청" />
      </View>
    );
  }

  // 3초 카운트다운
  const startCountdown = () => {
    setCountdown(10);
    const iv = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(iv);
          captureAndUpload();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleCapturePress = () => {
    if (!dadHeight || isNaN(+dadHeight) || +dadHeight <= 0) {
      Alert.alert('오류', '유효한 아빠 키를 입력해주세요.');
      return;
    }
    if (timerOn) startCountdown();
    else captureAndUpload();
  };

  const captureAndUpload = async () => {
    if (!cameraRef.current) return;
    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo?.uri) throw new Error('촬영 실패');
      const formData = new FormData();
      formData.append('dad_height', dadHeight);
      formData.append('camera_pitch', pitch?.toFixed(2) || '0'); 
      formData.append('image', {
        uri: photo.uri,
        name: `family_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);
      const res = await fetch(`${API_URL}/estimate-child-height`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) {
        Alert.alert('오류', data.error || '키 추정에 실패했습니다.');
      } else {
        setChildHeight(data.child_height_cm);
        setAnnotUri(`data:image/jpeg;base64,${data.annotated_image}`);
        setStep('result');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('오류', '사진 촬영 또는 업로드 실패');
    } finally {
      setLoading(false);
      setCountdown(0);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {step !== 'result' && (
          <>
            <CameraView
              style={styles.camera}
              facing={facing}
              ref={cameraRef}
            />
            {/* 뒤로가기 */}
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('index' as never)}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            {/* 전/후면 전환 */}
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setFacing(f => (f === 'back' ? 'front' : 'back'))}
            >
              <Ionicons name="camera-reverse" size={30} color="#fff" />
            </TouchableOpacity>
            {/* 타이머 토글 */}
            <TouchableOpacity
              style={[styles.switchButton, { left: 20, right: undefined }]}
              onPress={() => setTimerOn(on => !on)}
            >
              <Text style={styles.timerText}>{timerOn ? '⏱️ On' : '⏱️ Off'}</Text>
            </TouchableOpacity>
            {/* 키 입력 오버레이 */}
            <View style={styles.overlay}>
              <Text style={styles.prompt}>아빠 키를 입력하세요 (cm):</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="예: 175"
                value={dadHeight}
                onChangeText={setDadHeight}
                placeholderTextColor="#ccc"
              />
            </View>
            {/* 촬영 버튼 */}
            <View style={styles.controlContainer}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCapturePress}
                disabled={loading || countdown > 0}
              >
                <View style={styles.innerCircle} />
              </TouchableOpacity>
            </View>
            {/* 카운트다운 표시 */}
            {countdown > 0 && (
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
            )}
            {loading && (
              <ActivityIndicator style={styles.loader} size="large" color="#fff" />
            )}
          </>
        )}

        {step === 'result' && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>
              아이 예측 키: {childHeight?.toFixed(1)} cm
            </Text>
            {annotUri && (
              <TouchableOpacity onPress={() => {}}>
                <Image
                  source={{ uri: annotUri }}
                  style={styles.annotated}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default OnCamera;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1, width: '100%', height: '100%' },
  headerButton: { position: 'absolute', top: 50, left: 10, zIndex: 20, padding: 8 },
  switchButton: {
    position: 'absolute', bottom: 20, right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 25
  },
  timerText: { color: '#fff' },
  overlay: {
    position: 'absolute', top: '25%', width: '100%', alignItems: 'center', paddingHorizontal: 40
  },
  prompt: { color: '#fff', fontSize: 18, marginBottom: 8, textAlign: 'center' },
  input: {
    width: '60%', borderColor: '#fff', borderWidth: 1, borderRadius: 6,
    padding: 8, color: '#fff', textAlign: 'center'
  },
  controlContainer: {
    position: 'absolute', bottom: 20, width: '100%', alignItems: 'center'
  },
  captureButton: { width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: '#ddd'
  },
  innerCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ff0000' },
  countdownContainer: {
    position: 'absolute', top: '45%', left: 0, right: 0, alignItems: 'center'
  },
  countdownText: { fontSize: 72, color: '#fff', fontWeight: 'bold' },
  loader: { position: 'absolute', top: '50%', left: '45%' },
  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  resultText: { color: '#fff', fontSize: 22, marginBottom: 20 },
  annotated: { width: 300, height: 600, borderWidth: 2, borderColor: '#fff' },
  message: { textAlign: 'center', paddingBottom: 10, color: '#fff' }
});
