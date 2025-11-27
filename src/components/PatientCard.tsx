import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';
import { Feather } from '@expo/vector-icons';

type PatientCardProps = {
  patientName: string;
  patientId: string;
  dateTime: string;
  doctorName: string;
  doctorAvatar?: string;
  medicalCard?: string;
  patientAvatar?: string;
};

const PatientCard: React.FC<PatientCardProps> = ({
  patientName,
  patientId,
  dateTime,
  doctorName,
  doctorAvatar,
  medicalCard = 'No card',
  patientAvatar,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {patientAvatar ? (
          <Image source={{ uri: patientAvatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{patientName.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.patientName}>{patientName}</Text>
          <Text style={styles.patientId}>ID: {patientId}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Feather name="calendar" size={16} color={Colors.coolGrey} />
        <Text style={styles.infoText}>Date & Time: {dateTime}</Text>
      </View>

      <View style={styles.infoRow}>
        <Feather name="user" size={16} color={Colors.coolGrey} />
        <View style={styles.doctorInfo}>
          {doctorAvatar ? (
            <Image source={{ uri: doctorAvatar }} style={styles.doctorAvatar} />
          ) : (
            <View style={styles.doctorAvatarPlaceholder}>
              <Text style={styles.doctorAvatarText}>{doctorName.charAt(0)}</Text>
            </View>
          )}
          <Text style={styles.infoText}>Doctor: {doctorName}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Feather name="credit-card" size={16} color={Colors.coolGrey} />
        <Text style={styles.infoText}>Medical card: {medicalCard}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.roseRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  headerInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  patientId: {
    fontSize: 14,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.fogGrey,
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doctorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  doctorAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.roseRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  infoText: {
    fontSize: 14,
    color: Colors.darkSlate,
    fontFamily: Fonts.regular,
    flex: 1,
  },
});

export default PatientCard;

