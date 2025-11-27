import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Fonts } from '../constants/fonts';
import { useTheme } from '../hooks/useTheme';
import { Feather } from '@expo/vector-icons';

type MetricData = {
  label: string;
  value: string;
  unit?: string;
  icon?: string;
  chartData?: number[];
  progress?: number;
};

type HealthMetricsCardProps = {
  title: string;
  period: string;
  periodOptions?: string[];
  onPeriodChange?: (period: string) => void;
  avgValue: string;
  avgLabel: string;
  deepValue?: string;
  deepLabel?: string;
  chartData?: { day: string; value: number }[];
  otherMetrics?: MetricData[];
};

const HealthMetricsCard: React.FC<HealthMetricsCardProps> = ({
  title,
  period,
  periodOptions = ['Daily', 'Weekly', 'Monthly'],
  onPeriodChange,
  avgValue,
  avgLabel,
  deepValue,
  deepLabel,
  chartData = [],
  otherMetrics = [],
}) => {
  const { theme } = useTheme();
  const maxValue = Math.max(...chartData.map((d) => d.value), 10);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        <View style={[styles.periodSelector, { backgroundColor: theme.colors.primaryLight }]}>
          <Feather name="moon" size={18} color={theme.colors.primary} />
          <Text style={[styles.periodText, { color: theme.colors.primary }]}>{period}</Text>
          <Feather name="chevron-down" size={16} color={theme.colors.textSecondary} />
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>{avgLabel}</Text>
          <Text style={[styles.metricValue, { color: theme.colors.text }]}>{avgValue}</Text>
        </View>
        {deepValue && (
          <View style={styles.metricBox}>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>{deepLabel}</Text>
            <Text style={[styles.metricValue, { color: theme.colors.text }]}>{deepValue}</Text>
          </View>
        )}
      </View>

      {chartData.length > 0 && (
        <View style={styles.chartContainer}>
          <View style={styles.chart}>
            {chartData.map((data, index) => {
              const height = maxValue > 0 ? (data.value / maxValue) * 100 : 0;
              return (
                <View key={index} style={styles.chartBarContainer}>
                  <View style={styles.chartBarWrapper}>
                    <View
                      style={[
                        styles.chartBar,
                        { 
                          height: `${Math.max(height, 5)}%`,
                          backgroundColor: data.value === maxValue ? theme.colors.primaryDark : theme.colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.chartLabel, { color: theme.colors.textSecondary }]}>{data.day}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.chartAverageLine}>
            <View style={[styles.dashedLine, { borderTopColor: theme.colors.border }]} />
            <Text style={[styles.averageLabel, { color: theme.colors.textSecondary }]}>Avg {avgValue}</Text>
          </View>
        </View>
      )}

      {otherMetrics.length > 0 && (
        <View style={styles.otherMetricsContainer}>
          {otherMetrics.map((metric, index) => (
            <View key={index} style={styles.otherMetricItem}>
              <View style={styles.otherMetricLeft}>
                {metric.icon && (
                  <View style={[styles.metricIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                    <Feather name={metric.icon as any} size={20} color={theme.colors.primary} />
                  </View>
                )}
                <View style={styles.metricInfo}>
                  <Text style={[styles.otherMetricLabel, { color: theme.colors.textSecondary }]}>{metric.label}</Text>
                  <Text style={[styles.otherMetricValue, { color: theme.colors.text }]}>
                    {metric.value} {metric.unit || ''}
                  </Text>
                </View>
              </View>
              {metric.progress !== undefined && (
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { backgroundColor: theme.colors.surface }]}>
                    <View
                      style={[styles.progressBarFill, { width: `${metric.progress}%`, backgroundColor: theme.colors.primary }]}
                    />
                  </View>
                </View>
              )}
              <Feather name="chevron-right" size={18} color={theme.colors.textSecondary} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  metricBox: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '900',
    fontFamily: Fonts.bold,
  },
  chartContainer: {
    marginBottom: 24,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    marginBottom: 12,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBarWrapper: {
    width: '80%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 8,
  },
  chartLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 8,
  },
  chartAverageLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  averageLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginLeft: 8,
  },
  otherMetricsContainer: {
    gap: 16,
  },
  otherMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  otherMetricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricInfo: {
    flex: 1,
  },
  otherMetricLabel: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginBottom: 4,
  },
  otherMetricValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  progressBarContainer: {
    width: 60,
  },
  progressBar: {
    height: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 12,
  },
});

export default HealthMetricsCard;

