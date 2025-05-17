import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface MeasureChartProps {
  data: {
    labels: string[];
    datasets: { data: number[]; strokeWidth: number }[];
  };
}

const MeasureChart: React.FC<MeasureChartProps> = ({ data }) => {
  const chartConfig = {
    backgroundColor: '#aaa',
    backgroundGradientFrom: '#F2D8E3',
    backgroundGradientTo: '#F2D8E3',
    decimalPlaces: 2, // 소수점 자리수
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: styles.chartStyle,
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#fff',
    },
  };

  return (
    <LineChart
      data={data}
      width={Dimensions.get('window').width - 40} // 화면 너비에 맞게 조정
      height={220} // 차트의 높이
      chartConfig={chartConfig}
      bezier
      style={styles.chartContainer}
    />
  );
};

export default MeasureChart;

const styles = StyleSheet.create({
  chartContainer: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartStyle: {
    borderRadius: 16,
  },
});