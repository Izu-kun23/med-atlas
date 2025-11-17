import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';

const googleLogo = require('../../assets/logo/google.png');
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  time?: string;
  type: 'lecture' | 'study' | 'lab' | 'task' | 'exam' | 'shift';
  color: string;
  description?: string;
};

const CalendarScreen: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      date: new Date().toISOString().split('T')[0],
      title: 'Anatomy Lecture',
      time: '8:00 AM',
      type: 'lecture',
      color: Colors.roseRed,
    },
    {
      id: '2',
      date: new Date().toISOString().split('T')[0],
      title: 'Study Session',
      time: '2:00 PM',
      type: 'study',
      color: '#10B981',
    },
  ]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: new Date(),
    time: new Date(),
    type: 'lecture' as CalendarEvent['type'],
  });

  const eventTypeColors: Record<CalendarEvent['type'], string> = {
    lecture: '#6366F1',
    study: '#10B981',
    lab: '#F59E0B',
    task: '#EF4444',
    exam: '#8B5CF6',
    shift: '#06B6D4',
  };

  const eventTypeLabels: Record<CalendarEvent['type'], string> = {
    lecture: 'Lecture',
    study: 'Study',
    lab: 'Lab',
    task: 'Task',
    exam: 'Exam',
    shift: 'Shift',
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const formatDateKey = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const getEventsForDate = (date: Date | null): CalendarEvent[] => {
    if (!date) return [];
    const dateKey = formatDateKey(date);
    return events.filter((event) => event.date === dateKey);
  };

  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date | null): boolean => {
    if (!date) return false;
    return formatDateKey(date) === selectedDate;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleAddEvent = () => {
    const dateKey = formatDateKey(newEvent.date);
    const timeString = newEvent.time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const event: CalendarEvent = {
      id: Date.now().toString(),
      date: dateKey,
      title: newEvent.title,
      description: newEvent.description,
      time: timeString,
      type: newEvent.type,
      color: eventTypeColors[newEvent.type],
    };

    setEvents([...events, event]);
    setShowAddEventModal(false);
    setNewEvent({
      title: '',
      description: '',
      date: new Date(),
      time: new Date(),
      type: 'lecture',
    });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(formatDateKey(date));
    setNewEvent((prev) => ({ ...prev, date }));
  };

  const handleDayPress = (date: Date | null) => {
    if (date) {
      handleDateSelect(date);
    }
  };

  const selectedDateEvents = events.filter((event) => event.date === selectedDate);
  const days = getDaysInMonth(currentDate);

  const handleGoogleCalendar = () => {
    console.log('Add to Google Calendar');
  };

  const handleOutlook = () => {
    console.log('Add to Outlook');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.7}
          onPress={() => setShowAddEventModal(true)}
        >
          <Feather name="plus" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Month Navigation */}
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={() => navigateMonth('prev')}
            style={styles.monthNavButton}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={28} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          <TouchableOpacity
            onPress={() => navigateMonth('next')}
            style={styles.monthNavButton}
            activeOpacity={0.7}
          >
            <Feather name="chevron-right" size={28} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarContainer}>
          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {dayNames.map((day) => (
              <View key={day} style={styles.dayHeader}>
                <Text style={styles.dayHeaderText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Days */}
          <View style={styles.calendarGrid}>
            {days.map((date, index) => {
              const dateEvents = getEventsForDate(date);
              const isCurrentDay = isToday(date);
              const isSelectedDay = isSelected(date);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    isCurrentDay && styles.todayCell,
                    isSelectedDay && styles.selectedCell,
                    !date && styles.emptyCell,
                  ]}
                  onPress={() => handleDayPress(date)}
                  activeOpacity={0.7}
                  disabled={!date}
                >
                  {date && (
                    <>
                      <Text
                        style={[
                          styles.dayText,
                          isCurrentDay && styles.todayText,
                          isSelectedDay && styles.selectedText,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                      {dateEvents.length > 0 && (
                        <View style={styles.eventIndicators}>
                          {dateEvents.slice(0, 3).map((event, idx) => (
                            <View
                              key={idx}
                              style={[styles.eventDot, { backgroundColor: event.color }]}
                            />
                          ))}
                          {dateEvents.length > 3 && (
                            <Text style={styles.moreEventsText}>+{dateEvents.length - 3}</Text>
                          )}
                        </View>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Date Events */}
        {selectedDateEvents.length > 0 && (
          <View style={styles.eventsSection}>
            <Text style={styles.eventsSectionTitle}>
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            {selectedDateEvents.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={[styles.eventColorBar, { backgroundColor: event.color }]} />
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  {event.time && <Text style={styles.eventTime}>{event.time}</Text>}
                  {event.description && (
                    <Text style={styles.eventDescription}>{event.description}</Text>
                  )}
                </View>
                <View style={styles.eventActions}>
                  <TouchableOpacity
                    style={styles.eventActionButton}
                    onPress={handleGoogleCalendar}
                    activeOpacity={0.7}
                  >
                    <Image source={googleLogo} style={styles.eventActionIcon} resizeMode="contain" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.eventActionButton}
                    onPress={handleOutlook}
                    activeOpacity={0.7}
                  >
                    <Feather name="mail" size={22} color="#0078D4" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State for Selected Date */}
        {selectedDateEvents.length === 0 && (
          <View style={styles.emptyDateState}>
            <Feather name="calendar" size={64} color="#D1D5DB" />
            <Text style={styles.emptyDateTitle}>No events scheduled</Text>
            <Text style={styles.emptyDateText}>
              Tap the + button to add an event for{' '}
              {new Date(selectedDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        )}

        {/* Calendar Sync Options */}
        <View style={styles.syncSection}>
          <Text style={styles.syncSectionTitle}>Sync Calendar</Text>
          <Text style={styles.syncSectionSubtitle}>
            Export your events to your preferred calendar app
          </Text>
          <TouchableOpacity
            style={[styles.syncButton, styles.googleButton]}
            onPress={handleGoogleCalendar}
            activeOpacity={0.8}
          >
            <View style={styles.syncButtonContent}>
              <View style={styles.syncIconContainer}>
                <Image source={googleLogo} style={styles.googleLogo} resizeMode="contain" />
              </View>
              <View style={styles.syncButtonText}>
                <Text style={styles.syncButtonTitle}>Add to Google Calendar</Text>
                <Text style={styles.syncButtonSubtitle}>Sync with your Google account</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.syncButton, styles.outlookButton]}
            onPress={handleOutlook}
            activeOpacity={0.8}
          >
            <View style={styles.syncButtonContent}>
              <View style={[styles.syncIconContainer, { backgroundColor: '#0078D4' }]}>
                <Feather name="mail" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.syncButtonText}>
                <Text style={styles.syncButtonTitle}>Add to Outlook</Text>
                <Text style={styles.syncButtonSubtitle}>Sync with your Microsoft account</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Event Modal */}
      <Modal
        visible={showAddEventModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddEventModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Event</Text>
              <TouchableOpacity
                onPress={() => setShowAddEventModal(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Feather name="x" size={26} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Event Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Event Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter event title"
                  placeholderTextColor="#9CA3AF"
                  value={newEvent.title}
                  onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
                />
              </View>

              {/* Event Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Add a description"
                  placeholderTextColor="#9CA3AF"
                  value={newEvent.description}
                  onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Event Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Event Type</Text>
                <View style={styles.typeButtons}>
                  {(Object.keys(eventTypeLabels) as CalendarEvent['type'][]).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        newEvent.type === type && {
                          backgroundColor: Colors.roseRed,
                          borderColor: Colors.roseRed,
                        },
                      ]}
                      onPress={() => setNewEvent({ ...newEvent, type })}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          newEvent.type === type && styles.typeButtonTextActive,
                        ]}
                      >
                        {eventTypeLabels[type]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Date Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Feather name="calendar" size={22} color="#6366F1" />
                  <Text style={styles.dateTimeText}>
                    {newEvent.date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={newEvent.date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        setNewEvent({ ...newEvent, date: selectedDate });
                      }
                    }}
                  />
                )}
              </View>

              {/* Time Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Time</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                  activeOpacity={0.7}
                >
                  <Feather name="clock" size={22} color="#6366F1" />
                  <Text style={styles.dateTimeText}>
                    {newEvent.time.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={newEvent.time}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedTime) => {
                      setShowTimePicker(Platform.OS === 'ios');
                      if (selectedTime) {
                        setNewEvent({ ...newEvent, time: selectedTime });
                      }
                    }}
                  />
                )}
              </View>

              {/* Add Button */}
              <TouchableOpacity
                style={[
                  styles.addEventButton,
                  !newEvent.title && styles.addEventButtonDisabled,
                ]}
                onPress={handleAddEvent}
                activeOpacity={0.8}
                disabled={!newEvent.title}
              >
                <Text style={styles.addEventButtonText}>Add Event</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.roseRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  monthNavButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
  },
  calendarContainer: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    marginHorizontal: 34,
    marginBottom: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: -50,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  dayHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.coolGrey,
    fontFamily: Fonts.bold,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',

  },
  dayCell: {
    width: (SCREEN_WIDTH - 88) / 7,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    margin: 2,
    position: 'relative',
  },
  emptyCell: {
    opacity: 0,
  },
  todayCell: {
      backgroundColor: Colors.roseLight,
  },
  selectedCell: {
    backgroundColor: Colors.roseRed,
  },
  dayText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
  },
  todayText: {
    color: Colors.roseRed,
    fontWeight: '800',
    fontFamily: Fonts.bold,
  },
  selectedText: {
    color: Colors.white,
    fontWeight: '800',
    fontFamily: Fonts.bold,
  },
  eventIndicators: {
    position: 'absolute',
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  moreEventsText: {
    fontSize: 9,
    color: Colors.coolGrey,
    fontFamily: Fonts.semiBold,
    marginLeft: 2,
  },
  eventsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  eventsSectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 16,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.fogGrey,
  },
  eventColorBar: {
    width: 6,
  },
  eventContent: {
    flex: 1,
    padding: 20,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 6,
  },
  eventTime: {
    fontSize: 16,
    color: Colors.coolGrey,
    fontFamily: Fonts.medium,
    marginBottom: 6,
  },
  eventDescription: {
    fontSize: 15,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
    lineHeight: 22,
  },
  eventActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    gap: 12,
  },
  eventActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventActionIcon: {
    width: 24,
    height: 24,
  },
  emptyDateState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  emptyDateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginTop: 20,
    marginBottom: 12,
  },
  emptyDateText: {
    fontSize: 16,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 24,
  },
  syncSection: {
    paddingHorizontal: 24,
  },
  syncSectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 8,
  },
  syncSectionSubtitle: {
    fontSize: 16,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
    marginBottom: 20,
    lineHeight: 24,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
  },
  googleButton: {
    borderLeftWidth: 5,
    borderLeftColor: '#4285F4',
  },
  outlookButton: {
    borderLeftWidth: 5,
    borderLeftColor: '#0078D4',
  },
  syncButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  syncIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: Colors.white,
  },
  googleLogo: {
    width: 28,
    height: 28,
  },
  syncButtonText: {
    flex: 1,
  },
  syncButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  syncButtonSubtitle: {
    fontSize: 14,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 28,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fogGrey,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    padding: 28,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    fontSize: 17,
    color: Colors.darkSlate,
    fontFamily: Fonts.regular,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 0,
    backgroundColor: '#F3F4F6',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.coolGrey,
    fontFamily: Fonts.bold,
  },
  typeButtonTextActive: {
    color: Colors.white,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
  },
  dateTimeText: {
    fontSize: 17,
    color: Colors.darkSlate,
    fontFamily: Fonts.medium,
    flex: 1,
  },
  addEventButton: {
    backgroundColor: Colors.roseRed,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  addEventButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  addEventButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
});

export default CalendarScreen;