import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';
import { Feather } from '@expo/vector-icons';

type Medication = {
  id: string;
  name: string;
  dosage?: string;
};

type LabResult = {
  id: string;
  name: string;
  value: string;
  date: string;
};

type HealthSnapshot = {
  id: string;
  title: string;
  value?: string;
  image?: string;
  chartData?: number[];
};

type PatientRecordCardProps = {
  patientName: string;
  patientRole: string;
  patientAvatar?: string;
  healthSnapshots?: HealthSnapshot[];
  medications?: Medication[];
  labResults?: LabResult[];
  onMorePress?: () => void;
};

const PatientRecordCard: React.FC<PatientRecordCardProps> = ({
  patientName,
  patientRole,
  patientAvatar,
  healthSnapshots = [],
  medications = [],
  labResults = [],
  onMorePress,
}) => {
  const [expandedSections, setExpandedSections] = useState<{
    medications: boolean;
    labResults: boolean;
  }>({
    medications: true,
    labResults: false,
  });

  const toggleSection = (section: 'medications' | 'labResults') => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Patient card</Text>
      </View>

      <View style={styles.personalInfoSection}>
        <View style={styles.personalInfoHeader}>
          <Text style={styles.sectionTitle}>Personal information</Text>
          <TouchableOpacity onPress={onMorePress} activeOpacity={0.7}>
            <Feather name="more-vertical" size={20} color={Colors.coolGrey} />
          </TouchableOpacity>
        </View>
        <View style={styles.patientInfo}>
          {patientAvatar ? (
            <Image source={{ uri: patientAvatar }} style={styles.patientAvatar} />
          ) : (
            <View style={styles.patientAvatarPlaceholder}>
              <Text style={styles.patientAvatarText}>{patientName.charAt(0)}</Text>
            </View>
          )}
          <View>
            <Text style={styles.patientName}>{patientName}</Text>
            <Text style={styles.patientRole}>{patientRole}</Text>
          </View>
        </View>
      </View>

      {healthSnapshots.length > 0 && (
        <View style={styles.snapshotsSection}>
          {healthSnapshots.map((snapshot) => (
            <View key={snapshot.id} style={styles.snapshotCard}>
              {snapshot.image ? (
                <Image source={{ uri: snapshot.image }} style={styles.snapshotImage} />
              ) : (
                <View style={styles.snapshotPlaceholder}>
                  <Feather name="image" size={24} color={Colors.coolGrey} />
                </View>
              )}
              <View style={styles.snapshotContent}>
                <Text style={styles.snapshotTitle}>{snapshot.title}</Text>
                {snapshot.value && (
                  <Text style={styles.snapshotValue}>{snapshot.value}</Text>
                )}
                {snapshot.chartData && snapshot.chartData.length > 0 && (
                  <View style={styles.miniChart}>
                    {snapshot.chartData.map((value, index) => (
                      <View
                        key={index}
                        style={[
                          styles.miniChartBar,
                          { height: `${(value / Math.max(...snapshot.chartData!)) * 100}%` },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {medications.length > 0 && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('medications')}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>Current Medications</Text>
            <Feather
              name={expandedSections.medications ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Colors.coolGrey}
            />
          </TouchableOpacity>
          {expandedSections.medications && (
            <View style={styles.medicationsList}>
              {medications.map((medication) => (
                <View key={medication.id} style={styles.medicationCard}>
                  <View style={styles.medicationIcon}>
                    <Feather name="pill" size={18} color={Colors.roseRed} />
                  </View>
                  <View style={styles.medicationInfo}>
                    <Text style={styles.medicationName}>{medication.name}</Text>
                    {medication.dosage && (
                      <Text style={styles.medicationDosage}>{medication.dosage}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {labResults.length > 0 && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('labResults')}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>Lab Results</Text>
            <Feather
              name={expandedSections.labResults ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Colors.coolGrey}
            />
          </TouchableOpacity>
          {expandedSections.labResults && (
            <View style={styles.labResultsList}>
              {labResults.map((result) => (
                <View key={result.id} style={styles.labResultCard}>
                  <Text style={styles.labResultName}>{result.name}</Text>
                  <Text style={styles.labResultValue}>{result.value}</Text>
                  <Text style={styles.labResultDate}>{result.date}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
  },
  personalInfoSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  personalInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  patientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  patientAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.roseRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientAvatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  patientRole: {
    fontSize: 14,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  snapshotsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  snapshotCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
    gap: 12,
  },
  snapshotImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  snapshotPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.fogGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapshotContent: {
    flex: 1,
    justifyContent: 'center',
  },
  snapshotTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 8,
  },
  snapshotValue: {
    fontSize: 16,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
    marginBottom: 8,
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 30,
    gap: 2,
  },
  miniChartBar: {
    flex: 1,
    backgroundColor: Colors.roseRed,
    borderRadius: 2,
    minHeight: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicationsList: {
    gap: 12,
  },
  medicationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
    gap: 12,
  },
  medicationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.roseLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 13,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  labResultsList: {
    gap: 12,
  },
  labResultCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
  },
  labResultName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 8,
  },
  labResultValue: {
    fontSize: 16,
    color: Colors.roseRed,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  labResultDate: {
    fontSize: 12,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
});

export default PatientRecordCard;

