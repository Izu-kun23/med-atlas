import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Fonts } from '../../constants/fonts';
import { Colors } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/RootStackNavigator';
import { renderFormattedContent } from '../../utils/formatNoteContent';

type NoteDetailRouteProp = RouteProp<RootStackParamList, 'NoteDetail'>;
type NoteDetailNavigationProp = StackNavigationProp<RootStackParamList>;

const NoteDetailScreen: React.FC = () => {
  const navigation = useNavigation<NoteDetailNavigationProp>();
  const route = useRoute<NoteDetailRouteProp>();
  const params = route.params;

  const [elapsedSeconds, setElapsedSeconds] = useState(params?.elapsedSeconds || 0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startSecondsRef = useRef(params?.elapsedSeconds || 0);
  const startTimeRef = useRef(Date.now());

  // Initialize and manage timer when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (params?.isSessionActive && params?.elapsedSeconds !== undefined) {
        startSecondsRef.current = params.elapsedSeconds;
        startTimeRef.current = Date.now();
        setElapsedSeconds(params.elapsedSeconds);

        // Start timer that calculates elapsed time from start
        timerIntervalRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedSeconds(startSecondsRef.current + elapsed);
        }, 1000);
      }

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      };
    }, [params?.isSessionActive, params?.elapsedSeconds])
  );

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else if (minutes > 0) {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `00:${secs.toString().padStart(2, '0')}`;
    }
  };

  const note = params?.note;
  const subjectColor = params?.subjectColor || Colors.roseRed;
  const isSessionActive = params?.isSessionActive || false;

  if (!note) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={24} color={Colors.darkSlate} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Note</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Note not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header with Timer */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={24} color={Colors.darkSlate} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {isSessionActive && (
            <View style={[styles.timerBadge, { backgroundColor: subjectColor }]}>
              <Feather name="clock" size={14} color="#FFFFFF" />
              <Text style={styles.timerBadgeText}>{formatTime(elapsedSeconds)}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Note Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {note.createdAt && (
          <Text style={styles.noteDate}>
            {note.createdAt.toDate?.().toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }) || 'Recent'}
          </Text>
        )}
        <Text style={styles.noteTitle}>{note.title}</Text>
        <View style={[styles.divider, { backgroundColor: subjectColor }]} />
        <View style={styles.noteContent}>
          {renderFormattedContent(note.content)}
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fogGrey,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
  },
  headerRight: {
    width: 32,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  timerBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  noteDate: {
    fontSize: 13,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 20,
    lineHeight: 36,
  },
  divider: {
    height: 3,
    width: 60,
    borderRadius: 2,
    marginBottom: 24,
  },
  noteContent: {
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
});

export default NoteDetailScreen;
