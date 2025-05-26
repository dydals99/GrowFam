
import 'react-native-gesture-handler';
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Image, Alert, Keyboard, TouchableWithoutFeedback, Button} from 'react-native';
import { Camera, CameraType, useCameraPermissions,CameraView } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { API_URL } from '../../../constants/config';
import { DeviceMotion } from 'expo-sensors';
import { useLocalSearchParams } from "expo-router";
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useRouter } from "expo-router";

type Step = 'askHeight' | 'result';

const OnCamera: React.FC = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView | null>(null);
  const navigation = useNavigation();
  const router = useRouter();

  // 키 측정 상태
  const [step, setStep] = useState<Step>('askHeight');
  const [dadHeight, setDadHeight] = useState('');
  const [childHeight, setChildHeight] = useState<number | null>(null);
  const [annotUri, setAnnotUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pitch, setPitch] = useState<number | null>(null);
  const [tipVisible, setTipVisible] = useState(false);

  // 타이머 상태
  const [timerOn, setTimerOn] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const params = useLocalSearchParams();
  const kidInfoNo = params.kid_info_no; 

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') console.warn('카메라 권한이 거부되었습니다.');
    })();

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
      formData.append('ref_height', dadHeight);
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
  const handleSaveMeasure = async () => {
    if (!childHeight || !kidInfoNo) {
      Alert.alert('오류', '측정값 또는 아이 정보가 없습니다.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/measure/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kid_info_no: Number(kidInfoNo),
          measure_height: childHeight.toFixed(1),
        }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('저장 완료', '측정 기록이 저장되었습니다.');
      } else {
        Alert.alert('오류', data.error || '저장에 실패했습니다.');
      }
    } catch (e) {
      Alert.alert('오류', '저장 중 문제가 발생했습니다.');
    }
  };

  // 이미지 저장하기 버튼 핸들러
  const handleSaveImage = async () => {
    if (!annotUri) {
      Alert.alert('오류', '저장할 이미지가 없습니다.');
      return;
    }
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('오류', '갤러리 저장 권한이 필요합니다.');
        return;
      }
      let fileUri = annotUri;
      if (annotUri.startsWith('data:image')) {
        // base64 → 파일로 저장
        const base64 = annotUri.split(',')[1];
        fileUri = FileSystem.cacheDirectory + `annot_${Date.now()}.jpg`;
        await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      }
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync('Download', asset, false);
      Alert.alert('저장 완료', '이미지가 갤러리에 저장되었습니다.');
    } catch (e) {
      Alert.alert('오류', '이미지 저장에 실패했습니다.');
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
            {/* 각도 표시 및 수평선 */}
            <View style={styles.pitchOverlay}>
              <View style={styles.pitchLineWrap}>
                {/* 기준선: 항상 중앙(흰색) */}
                <View style={styles.pitchBaseLine} />
                {/* 현재 각도선: pitch에 따라 이동, 색상 변화 */}
                <View
                  style={[
                    styles.pitchMoveLine,
                    {
                      // pitch가 0이면 중앙, 음수면 위, 양수면 아래로 이동
                      transform: [
                        {
                          translateY:
                            pitch !== null
                            ? Math.max(-10, Math.min(10, (pitch - 0) * 2)) // ±5도 기준 최대 15px 이동
                              : 0,
                        },
                      ],
                      backgroundColor:
                        pitch !== null && Math.abs(pitch) > 5
                          ? '#f44336'
                          : pitch !== null && Math.abs(pitch) > 2
                          ? '#ffb300'
                          : '#4caf50',
                    },
                  ]}
                />
                {/* 각도 숫자 */}
                <Text style={styles.pitchText} >
                  {pitch !== null ? `${pitch.toFixed(1)}°` : '-'}
                </Text>
              </View>
            </View>
           
            {/* TIP ? 버튼 */}
            <TouchableOpacity
              style={styles.tipCircle}
              onPress={() => setTipVisible(v => !v)}
              activeOpacity={0.7}
            >
              <Text style={styles.tipCircleText}>?</Text>
            </TouchableOpacity>
            {/* TIP 내용 박스 (토글) */}
            {tipVisible && (
              <View style={styles.tipBox}>
                <Text style={styles.tipTitle}>TIP</Text>
                <Text style={styles.tipText}>
                  카메라를 최대한 수평(0°)에 가깝게 유지하세요.{"\n"}
                  <Text style={{ color: '#4caf50' }}>0~2°: 초록(정상)</Text>{"\n"}
                  <Text style={{ color: '#ffb300' }}>3~5°: 노랑(주의)</Text>{"\n"}
                  <Text style={{ color: '#f44336' }}>5° 초과: 빨강(재측정 필요)</Text>
                </Text>
              </View>
            )}
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
              <Text style={styles.prompt}>기준이 될 사람의 키를 입력하세요.(cm):</Text>
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
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {annotUri && (
              <View style={{ position: 'relative', width: 300, height: 600 }}>
                {/* 예측 키 오버레이 */}
                <View style={{
                  position: 'absolute',
                  top: 18,
                  left: 0,
                  width: '100%',
                  alignItems: 'center',
                  zIndex: 10,
                }}>
                  <View style={{
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                  }}>
                    <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
                      아이 예측 키: {childHeight?.toFixed(1)} cm
                    </Text>
                  </View>
                </View>
                {/* 실제 측정 이미지 */}
                <Image
                  source={{ uri: annotUri }}
                  style={styles.annotated}
                />
              </View>
            )}
          </View>
          {/* 네비게이션 바 스타일 버튼 */}
          <View style={styles.navBar}>
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnBorder]}
              onPress={() => navigation.navigate('index' as never)}
            >
              <Ionicons name="home-outline" style={styles.navBtnIcon} />
              <Text style={styles.navBtnLabel}>메인화면</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnBorder]}
              onPress={() => {
                setStep('askHeight');
                setAnnotUri(null);
                setChildHeight(null);
              }}
            >
              <Ionicons name="refresh" style={styles.navBtnIcon} />
              <Text style={styles.navBtnLabel}>다시 측정</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnBorder]}
              onPress={handleSaveMeasure}
            >
              <Ionicons name="save-outline" style={styles.navBtnIcon} />
              <Text style={styles.navBtnLabel}>측정 기록</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={handleSaveImage}
            >
              <Ionicons name="download-outline" style={styles.navBtnIcon} />
              <Text style={styles.navBtnLabel}>이미지 저장</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default OnCamera;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000' },
  camera: { 
    flex: 1, 
    width: '100%', 
    height: '100%' },
  headerButton: { 
    position: 'absolute', 
    top: 50, left: 10, 
    zIndex: 20, 
    padding: 8 },
  switchButton: {
    position: 'absolute', bottom: 50, right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', 
    padding: 10, 
    borderRadius: 25
  },
  timerText: { color: '#fff' },
  overlay: {
    position: 'absolute', 
    top: '25%', 
    width: '100%', 
    alignItems: 'center', 
    paddingHorizontal: 40
  },
  prompt: { 
    color: '#fff', 
    fontSize: 18, 
    marginBottom: 8, 
    textAlign: 'center' },
  input: {
    width: '60%', 
    borderColor: '#fff', 
    borderWidth: 1, 
    borderRadius: 6,
    padding: 8, color: '#fff', 
    textAlign: 'center'
  },
  controlContainer: {
    position: 'absolute', 
    bottom: 40, 
    width: '100%', 
    alignItems: 'center'
  },
  captureButton: { 
    width: 80, 
    height: 80, 
    borderRadius: 40,
    backgroundColor: '#000', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 3, 
    borderColor: '#ddd'
  },
  innerCircle: { 
    width: 68, 
    height: 68, 
    borderRadius: 35, 
    backgroundColor: '#fff' },
  countdownContainer: {
    position: 'absolute', 
    top: '45%', 
    left: 0, 
    right: 0, 
    alignItems: 'center',
    bottom: 10
  },
  countdownText: { 
    fontSize: 72, 
    color: '#fff', 
    fontWeight: 'bold' },
  loader: { 
    position: 'absolute', 
    top: '50%', 
    left: '45%' },
  resultContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' },
  resultText: { 
    color: '#fff', 
    fontSize: 22, 
    marginBottom: 20 },
  annotated: { 
    width: 300, 
    height: 650, 
    borderWidth: 2, 
    borderColor: '#fff' },
  message: { 
    textAlign: 'center', 
    paddingBottom: 10, 
    color: '#fff' },
  compareBtn: {
    backgroundColor: "#b7d6bb",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  compareBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginTop: 24,
    marginHorizontal: 24,
    width:400,
    height: 90,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom:10
  },
  navBtn: {
    flex: 1,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  navBtnBorder: {
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  navBtnIcon: {
    fontSize: 28,
    color: '#888',
    marginBottom: 2,
  },
  navBtnLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    fontWeight: '600',
  },
  pitchOverlay: {
    position: 'absolute',
    top: 400,
    left: 0,
    width: '100%',
    alignItems: 'center',
    zIndex: 30,
  },
  pitchLineWrap: {
    width: 120,
    height: 50, 
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pitchBaseLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    width: '100%',
    height: 3,
    backgroundColor: '#ccc',
    borderRadius: 2,
    zIndex: 1,
  },
  pitchMoveLine: {
    position: 'absolute',
    left: 0,
    width: '100%',
    height: 3,
    borderRadius: 2,
    zIndex: 2,
  },
  pitchText: {
    position: 'absolute',
    left: 45,
    top: -10,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: 40,
  },
  tipBox: {
    position: 'absolute',
    top: 92, // tipCircle 아래에 위치
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    padding: 10,
    minWidth: 160,
    zIndex: 40,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tipTitle: {
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    fontSize: 14,
  },
  tipText: {
    fontSize: 12,
    color: '#444',
    lineHeight: 18,
  },
   tipCircle: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 30,
    height: 30,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 41,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tipCircleText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 25,
  },
  footLineWrap: {
    position: 'absolute',
    bottom: 120, // 촬영 버튼보다 약간 위
    left: 0,
    width: '100%',
    alignItems: 'center',
    zIndex: 25,
  },
  footLine: {
    width: 180,
    height: 4,
    backgroundColor: '#4caf50',
    borderRadius: 2,
    opacity: 0.8,
  },
  footLineText: {
    marginTop: 4,
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
  },
});
