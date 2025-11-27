import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';
import { Feather } from '@expo/vector-icons';

type ScheduleDay = {
  day: string;
  hasEvent: boolean;
};

type ProgressCardProps = {
  doctorName: string;
  doctorRole: string;
  doctorAvatar?: string;
  planProgress: number;
  planMessage: string;
  timeRange: string;
  daysRemaining: number;
  scheduleDays: ScheduleDay[];
  onMorePress?: () => void;
};

const ProgressCard: React.FC<ProgressCardProps> = ({
  doctorName,
  doctorRole,
  doctorAvatar,
  planProgress,
  planMessage,
  timeRange,
  daysRemaining,
  scheduleDays,
  onMorePress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.doctorHeader}>
        <View style={styles.doctorInfo}>
          {doctorAvatar ? (
            <Image source={{ uri: doctorAvatar }} style={styles.doctorAvatar} />
          ) : (
            <View style={styles.doctorAvatarPlaceholder}>
              <Text style={styles.doctorAvatarText}>{doctorName.charAt(0)}</Text>
            </View>
          )}
          <View>
            <Text style={styles.doctorName}>{doctorName}</Text>
            <Text style={styles.doctorRole}>{doctorRole}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onMorePress} activeOpacity={0.7}>
          <Feather name="more-vertical" size={20} color={Colors.coolGrey} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.progressMessage}>{planMessage}</Text>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressBarFill, { width: `${planProgress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{planProgress}%</Text>
        </View>
        <View style={styles.timeRangeContainer}>
          <Text style={styles.timeRangeText}>{timeRange}</Text>
          <Text style={styles.daysRemainingText}>{daysRemaining} left</Text>
        </View>
      </View>

      <View style={styles.scheduleSection}>
        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleTitle}>Your schedule</Text>
          <View style={styles.scheduleIcons}>
            <Feather name="search" size={18} color={Colors.coolGrey} />
            <Feather name="more-horizontal" size={18} color={Colors.coolGrey} />
          </View>
        </View>
        <View style={styles.scheduleDays}>
          {scheduleDays.map((day, index) => (
            <View key={index} style={styles.scheduleDay}>
              <Text style={styles.scheduleDayLabel}>{day.day}</Text>
              {day.hasEvent && (
                <View style={styles.scheduleCheckmark}>
                  <Feather name="check" size={14} color={Colors.roseRed} />
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
  },
  doctorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  doctorAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.roseRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 2,
  },
  doctorRole: {
    fontSize: 13,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressMessage: {
    fontSize: 15,
    color: Colors.darkSlate,
    fontFamily: Fonts.regular,
    marginBottom: 12,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.fogGrey,
    borderRadius: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.roseRed,
    borderRadius: 16,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.roseRed,
    fontFamily: Fonts.bold,
    minWidth: 40,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeRangeText: {
    fontSize: 13,
    color: Colors.roseRed,
    fontFamily: Fonts.semiBold,
  },
  daysRemainingText: {
    fontSize: 13,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  scheduleSection: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.fogGrey,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
  },
  scheduleIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  scheduleDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scheduleDay: {
    alignItems: 'center',
    gap: 8,
  },
  scheduleDayLabel: {
    fontSize: 12,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  scheduleCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 20,
    backgroundColor: Colors.roseLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProgressCard;

