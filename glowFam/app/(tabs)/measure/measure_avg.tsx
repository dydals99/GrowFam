import React from "react";
import { View, Text, StyleSheet, Dimensions, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { BarChart } from "react-native-chart-kit";

const MeasureAvg = () => {
  const { comparisonData } = useLocalSearchParams();

  const parsedComparisonData = JSON.parse(comparisonData as string);

  // 그래프 데이터
  const chartData = {
    labels: ["키", "몸무게", "BMI"],
    datasets: [
      {
        data: [
          parsedComparisonData.averageHeight, 
          parsedComparisonData.height, 
          parsedComparisonData.averageWeight, 
          parsedComparisonData.weight, 
          parsedComparisonData.averageBMI, 
          parsedComparisonData.bmi,
        ],
        colors: [
          // 막대별 색상 설정
          (opacity = 1) => `rgba(0, 123, 255, ${opacity})`, 
          (opacity = 1) => `rgba(200, 200, 255, ${opacity})`, 
          (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
          (opacity = 1) => `rgba(200, 200, 255, ${opacity})`,
          (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
          (opacity = 1) => `rgba(200, 200, 255, ${opacity})`,
        ],
      },
    ],
  };
  const screenWidth = Dimensions.get('window').width - 32;

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientFromOpacity: 1,
    backgroundGradientTo: "#ffffff",
    backgroundGradientToOpacity: 0.5,
    color: (opacity = 1) => `rgba(60, 100, 200, ${opacity})`,
    strokeWidth: 2, 
    barPercentage: 0.5,
    
  };
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
      우리 아이는{"\n"}
        <Text style={styles.highlight}>
          상위 {(100 - Number(parsedComparisonData.heightPercentile || 0)).toFixed(1)}% 키{"\n"}
        </Text>
        <Text style={styles.highlight}>
          상위 {(100 - Number(parsedComparisonData.weightPercentile)).toFixed(1)}% 몸무게{"\n"}
        </Text>
        <Text style={styles.highlight}>
          상위 {(100 - Number(parsedComparisonData.bmiPercentile)).toFixed(1)}% BMI
        </Text>
          를 기록했어요!
      </Text>
      
      {/* 상단 레이블 */}
      <View style={styles.row}>
        <Text style={styles.columnHeader}>우리 아이</Text>
        <Text style={styles.columnHeader}>평균 아이</Text>
      </View>

      {/* 키 컨테이너 */}
      <View style={styles.row}>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>{parsedComparisonData.height}CM</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>{parsedComparisonData.averageHeight}CM</Text>
        </View>
      </View>

      {/* 몸무게 컨테이너 */}
      <View style={styles.row}>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>{parsedComparisonData.weight}KG</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>{parsedComparisonData.averageWeight}KG</Text>
        </View>
      </View>

      {/* BMI 컨테이너 */}
      <View style={styles.row}>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>{parsedComparisonData.bmi}BMI</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>{parsedComparisonData.averageBMI}BMI</Text>
        </View>
      </View>

      <View style={styles.resultContainer}>
        <Text style={styles.resultText}>
          평균보다 키는{" "}
          <Text style={styles.highlight}>
            {Math.abs(parsedComparisonData.heightDifference)}cm{" "}
            {parsedComparisonData.heightDifference > 0 ? "더 큽니다." : "더 작습니다."}
          </Text>
        </Text>
        <Text style={styles.resultText}>
          몸무게는 평균보다{" "}
          <Text style={styles.highlight}>
            {Math.abs(parsedComparisonData.weightDifference)}kg{" "}
            {parsedComparisonData.weightDifference > 0 ? "더 많습니다." : "더 적습니다."}
          </Text>
        </Text>
        <Text style={styles.resultText}>
          BMI는 평균보다{" "}
          <Text style={styles.highlight}>
            {Math.abs(parsedComparisonData.bmiDifference).toFixed(1)}{" "}
            {parsedComparisonData.bmiDifference > 0 ? "더 높습니다." : "더 낮습니다."}
          </Text>
        </Text>
      </View>

      {/* 수직 막대 그래프 */}
      <BarChart
        data={chartData}
        width={screenWidth} 
        height={450} 
        yAxisLabel=""
        yAxisSuffix=""
        yAxisInterval={5} 
        fromZero={true}
        chartConfig={chartConfig}
        verticalLabelRotation={0} 
        style={styles.chart}
        withCustomBarColorFromData={true}
        flatColor={true} 
      />
    </ScrollView>
  );
};

export default MeasureAvg;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9", 
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#007bff", 
    marginBottom: 20,
    marginTop:50
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  columnHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    textAlign: "center",
    width: "48%", 
  },
  infoContainer: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    width: "48%",
    height : 70
  },
  infoText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    paddingTop: 10
  },
  resultContainer: {
    backgroundColor: "#e9f7ff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  resultText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
  },
  highlight: {
    fontWeight: "bold",
    color: "#007bff",
  },
  chart: {
    marginTop: 20,
    borderRadius: 16,
  },
});