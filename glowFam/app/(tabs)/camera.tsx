import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CameraView } from 'expo-camera';
import { API_URL } from '../../constants/config';

const DistanceChecker = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let interval: NodeJS.Timeout | null = null;
    let isMounted = true; // 컴포넌트 마운트 상태를 추적

    const initializeWebSocket = () => {
      ws = new WebSocket(`ws://172.30.1.79:8080/act_camera/ws/distance`);

      ws.onopen = () => {
        console.log('WebSocket 연결 성공');
      };

      ws.onmessage = (event) => {
        console.log('WebSocket 메시지 수신:', event.data);
        if (isMounted) {
          setMessage(event.data);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket 오류:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket 연결 종료');
      };
    };

    const sendImage = async () => {
      if (cameraRef && cameraReady && isMounted) {
        try {
          const photo = await cameraRef.takePictureAsync({
            base64: true,
            skipProcessing: true, // 이미지 후처리 생략
          });
          if (photo && photo.base64 && ws?.readyState === WebSocket.OPEN) {
            ws.send(photo.base64); // Base64 문자열을 WebSocket으로 전송
          }
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes('Camera unmounted')) {
              console.warn('카메라가 언마운트된 상태에서 이미지를 캡처하려고 했습니다.');
            } else {
              console.warn('이미지 전송 중 오류 발생:', error.message);
            }
          } else {
            console.warn('알 수 없는 오류 발생:', error);
          }
        }
      }
    };

    // WebSocket 초기화 및 이미지 전송 주기 설정
    initializeWebSocket();
    interval = setInterval(sendImage, 500); // 0.5초마다 이미지 전송

    return () => {
      // 컴포넌트 언마운트 시 WebSocket 및 Interval 정리
      isMounted = false; // 컴포넌트가 언마운트되었음을 표시
      if (interval) clearInterval(interval);
      if (ws) ws.close();
    };
  }, [cameraReady, cameraRef]);

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        ref={(ref) => setCameraRef(ref)}
        onCameraReady={() => setCameraReady(true)}
      />
      <View style={styles.overlay}>
        <Text style={styles.message}>{message || '거리 정보를 기다리는 중...'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  overlay: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
  },
  message: { fontSize: 18, color: '#fff', marginBottom: 10 },
});

export default DistanceChecker;