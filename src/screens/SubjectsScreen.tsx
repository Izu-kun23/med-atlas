import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Subject = {
  id: string;
  name: string;
  description?: string;
  progress: number;
  notesCount: number;
  studySessionsCount: number;
  examDate?: string;
  examDaysRemaining?: number;
  color: string;
  bgColor: string;
};

const SubjectsScreen: React.FC = () => {
  const [isIntern] = useState(false); // This should come from user context/state
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - replace with Firebase data later
  const subjects: Subject[] = [
    {
      id: '1',
      name: 'Anatomy',
      description: 'Human anatomy and physiology',
      progress: 75,
      notesCount: 24,
      studySessionsCount: 18,
      examDate: '2024-12-20',
      examDaysRemaining: 33,
      color: Colors.roseRed,
      bgColor: Colors.roseLight,
    },
    {
      id: '2',
      name: 'Surgery',
      description: 'General and specialized surgery',
      progress: 45,
      notesCount: 12,
      studySessionsCount: 8,
      examDate: '2024-12-25',
      examDaysRemaining: 38,
      color: Colors.errorRed,
      bgColor: '#FEF2F2',
    },
    {
      id: '3',
      name: 'Physiology',
      description: 'Human body functions',
      progress: 60,
      notesCount: 18,
      studySessionsCount: 12,
      color: Colors.successGreen,
      bgColor: '#ECFDF5',
    },
    {
      id: '4',
      name: 'Pathology',
      description: 'Disease mechanisms and diagnosis',
      progress: 30,
      notesCount: 8,
      studySessionsCount: 5,
      examDate: '2025-01-15',
      examDaysRemaining: 59,
      color: Colors.warningAmber,
      bgColor: '#FFFBEB',
    },
  ];

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSubjectCard = (subject: Subject) => (
    <TouchableOpacity key={subject.id} style={styles.subjectCard} activeOpacity={0.7}>
      <View style={styles.subjectHeader}>
        <View style={[styles.subjectIconContainer, { backgroundColor: subject.bgColor }]}>
          <Text style={[styles.subjectInitial, { color: subject.color }]}>
            {subject.name.charAt(0)}
          </Text>
        </View>
        <View style={styles.subjectInfo}>
          <Text style={styles.subjectName}>{subject.name}</Text>
          {subject.description && (
            <Text style={styles.subjectDescription} numberOfLines={1}>
              {subject.description}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
          <Feather name="more-vertical" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>{subject.progress}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${subject.progress}%`, backgroundColor: subject.color }]} />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Feather name="file-text" size={16} color="#6B7280" />
          <Text style={styles.statText}>{subject.notesCount} Notes</Text>
        </View>
        <View style={styles.statItem}>
          <Feather name="book-open" size={16} color="#6B7280" />
          <Text style={styles.statText}>{subject.studySessionsCount} Sessions</Text>
        </View>
      </View>

      {/* Exam Countdown */}
      {subject.examDate && subject.examDaysRemaining && (
        <View style={styles.examBadge}>
                <Feather name="calendar" size={14} color={Colors.errorRed} />
          <Text style={styles.examText}>
            Exam in {subject.examDaysRemaining} {subject.examDaysRemaining === 1 ? 'day' : 'days'}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton, { borderColor: subject.color }]}
          activeOpacity={0.8}
        >
          <Feather name="play-circle" size={18} color={subject.color} />
          <Text style={[styles.actionButtonText, { color: subject.color }]}>Start Study</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          activeOpacity={0.8}
        >
          <Feather name="file-text" size={18} color="#6B7280" />
          <Text style={styles.secondaryButtonText}>View Notes</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{isIntern ? 'Rotations' : 'Subjects'}</Text>
          <Text style={styles.headerSubtitle}>
            {filteredSubjects.length} {filteredSubjects.length === 1 ? 'subject' : 'subjects'}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} activeOpacity={0.7}>
          <Feather name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Search subjects...</Text>
        </View>

        {/* Subjects List */}
        {filteredSubjects.length > 0 ? (
          <View style={styles.subjectsList}>
            {filteredSubjects.map(renderSubjectCard)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Feather name="book-open" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No subjects found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'Try a different search term' : 'Add your first subject to get started'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={styles.emptyStateButton} activeOpacity={0.8}>
                <Feather name="plus" size={20} color="#FFFFFF" />
                <Text style={styles.emptyStateButtonText}>Add Subject</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.roseRed,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.roseRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: Fonts.regular,
  },
  subjectsList: {
    paddingHorizontal: 24,
    gap: 16,
  },
  subjectCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subjectIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subjectInitial: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  subjectDescription: {
    fontSize: 14,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  moreButton: {
    padding: 4,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  examBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
    gap: 6,
  },
  examText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.errorRed,
    fontFamily: Fonts.semiBold,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.coolGrey,
    fontFamily: Fonts.semiBold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.roseRed,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: Fonts.semiBold,
  },
});

export default SubjectsScreen;
