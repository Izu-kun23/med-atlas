import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import SvgIcon from '../../components/SvgIcon';
import TabBar from '../../components/TabBar';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { Fonts } from '../../constants/fonts';
import { useTheme } from '../../hooks/useTheme';
import { googleCalendarService } from '../../services/googleCalendarService';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, where, getDocs, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { Alert } from 'react-native';
import { getResponsivePadding, SCREEN_WIDTH } from '../../utils/responsive';

const googleLogo = require('../../../assets/logo/google.png');

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
  const { theme } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('month');
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: new Date(),
    time: new Date(),
    type: 'lecture' as CalendarEvent['type'],
  });

  // Check Google Calendar connection status on mount
  useEffect(() => {
    checkGoogleConnection();
  }, []);

  // Fetch calendar events from Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setIsLoadingEvents(false);
      return;
    }

    setIsLoadingEvents(true);
    const eventsQuery = query(
      collection(db, 'calendarEvents'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
        const fetchedEvents: CalendarEvent[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedEvents.push({
            id: doc.id,
            date: data.date,
            title: data.title,
            time: data.time || undefined,
            type: data.type,
            color: data.color || eventTypeColors[data.type as CalendarEvent['type']] || theme.colors.primary,
            description: data.description || undefined,
          });
        });
        setEvents(fetchedEvents);
        setIsLoadingEvents(false);
      },
      (error) => {
        console.error('Error fetching calendar events:', error);
        setIsLoadingEvents(false);
        Toast.show({
          type: 'error',
          text1: 'Error loading events',
          text2: 'Failed to load calendar events',
          position: 'top',
        });
      }
    );

    return () => unsubscribe();
  }, []);

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
    
    // Get first day of the month
    const firstDay = new Date(year, month, 1);
    // Get last day of the month (day 0 of next month)
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      days.push(dayDate);
    }
    
    // Ensure we always have a multiple of 7 days for proper grid layout
    // Add empty cells at the end if needed
    const totalCells = days.length;
    const remainingCells = totalCells % 7;
    if (remainingCells !== 0) {
      const cellsToAdd = 7 - remainingCells;
      for (let i = 0; i < cellsToAdd; i++) {
        days.push(null);
      }
    }
    
    return days;
  };

  const formatDateKey = (date: Date | null): string => {
    if (!date) return '';
    // Use local date to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getEventsForDate = (date: Date | null): CalendarEvent[] => {
    if (!date) return [];
    const dateKey = formatDateKey(date);
    return events.filter((event) => event.date === dateKey);
  };

  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    // Compare year, month, and day using local time
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
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

  const handleAddEvent = async () => {
    const user = auth.currentUser;
    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Authentication required',
        text2: 'Please log in to create events',
        position: 'top',
      });
      return;
    }

    const dateKey = formatDateKey(newEvent.date);
    const timeString = newEvent.time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    try {
      const eventData = {
        userId: user.uid,
        date: dateKey,
        title: newEvent.title,
        description: newEvent.description || '',
        time: timeString,
        type: newEvent.type,
        color: eventTypeColors[newEvent.type],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'calendarEvents'), eventData);

      setShowAddEventModal(false);
      setNewEvent({
        title: '',
        description: '',
        date: new Date(),
        time: new Date(),
        type: 'lecture',
      });
      Toast.show({
        type: 'success',
        text1: 'Event created',
        text2: 'Your calendar event has been successfully saved',
        position: 'top',
      });
    } catch (error: any) {
      console.error('Error saving event:', error);
      Toast.show({
        type: 'error',
        text1: 'Save failed',
        text2: 'Failed to save event. Please try again.',
        position: 'top',
      });
    }
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

  const checkGoogleConnection = async () => {
    try {
      const isConnected = await googleCalendarService.isAuthenticated();
      setIsGoogleConnected(isConnected);
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error);
      setIsGoogleConnected(false);
    }
  };

  const handleGoogleCalendar = async () => {
    try {
      if (!isGoogleConnected) {
        // Connect to Google Calendar
        setIsSyncing(true);
        const success = await googleCalendarService.authenticate();
        setIsSyncing(false);

        if (success) {
          setIsGoogleConnected(true);
          Alert.alert(
            'Success',
            'Google Calendar connected successfully! You can now sync your events.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Connection Failed',
            'Failed to connect to Google Calendar. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // Already connected - show options
        Alert.alert(
          'Google Calendar',
          'What would you like to do?',
          [
            {
              text: 'Sync Events',
              onPress: syncEventsToGoogle,
            },
            {
              text: 'Disconnect',
              style: 'destructive',
              onPress: handleDisconnectGoogle,
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error: any) {
      setIsSyncing(false);
      Alert.alert(
        'Error',
        error.message || 'Failed to connect to Google Calendar. Please check your configuration.',
        [{ text: 'OK' }]
      );
    }
  };

  const syncEventsToGoogle = async () => {
    try {
      setIsSyncing(true);
      
      // Sync all events to Google Calendar
      for (const event of events) {
        const eventDate = new Date(event.date);
        const [hours, minutes] = event.time
          ? event.time.replace(/[APM]/g, '').split(':').map((s) => parseInt(s.trim(), 10))
          : [9, 0];
        
        const isPM = event.time?.includes('PM') || false;
        const adjustedHours = isPM && hours !== 12 ? hours + 12 : hours === 12 && !isPM ? 0 : hours;

        const startDateTime = new Date(eventDate);
        startDateTime.setHours(adjustedHours, minutes, 0, 0);

        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + 1); // Default 1 hour duration

        const googleEvent = {
          summary: event.title,
          description: event.description || `${eventTypeLabels[event.type]} - ${event.title}`,
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        };

        await googleCalendarService.createEvent(googleEvent);
      }

      setIsSyncing(false);
      Alert.alert(
        'Success',
        `Successfully synced ${events.length} event(s) to Google Calendar!`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      setIsSyncing(false);
      Alert.alert(
        'Sync Failed',
        error.message || 'Failed to sync events to Google Calendar.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDisconnectGoogle = async () => {
    Alert.alert(
      'Disconnect Google Calendar',
      'Are you sure you want to disconnect your Google Calendar?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await googleCalendarService.logout();
            setIsGoogleConnected(false);
            Alert.alert('Disconnected', 'Google Calendar has been disconnected.', [{ text: 'OK' }]);
          },
        },
      ]
    );
  };

  const addEventToGoogleCalendar = async (event: CalendarEvent) => {
    try {
      if (!isGoogleConnected) {
        Alert.alert(
          'Not Connected',
          'Please connect to Google Calendar first to sync events.',
          [
            {
              text: 'Connect Now',
              onPress: handleGoogleCalendar,
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
        return;
      }

      setIsSyncing(true);
      const eventDate = new Date(event.date);
      const [hours, minutes] = event.time
        ? event.time.replace(/[APM]/g, '').split(':').map((s) => parseInt(s.trim(), 10))
        : [9, 0];
      
      const isPM = event.time?.includes('PM') || false;
      const adjustedHours = isPM && hours !== 12 ? hours + 12 : hours === 12 && !isPM ? 0 : hours;

      const startDateTime = new Date(eventDate);
      startDateTime.setHours(adjustedHours, minutes, 0, 0);

      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + 1);

      const googleEvent = {
        summary: event.title,
        description: event.description || `${eventTypeLabels[event.type]} - ${event.title}`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };

      const eventId = await googleCalendarService.createEvent(googleEvent);
      setIsSyncing(false);

      if (eventId) {
        Toast.show({
          type: 'success',
          text1: 'Event synced',
          text2: 'Event has been added to Google Calendar',
          position: 'top',
        });
      }
    } catch (error: any) {
      setIsSyncing(false);
      Toast.show({
        type: 'error',
        text1: 'Sync failed',
        text2: error.message || 'Failed to add event to Google Calendar',
        position: 'top',
      });
    }
  };

  const handleOutlook = () => {
    Alert.alert('Coming Soon', 'Outlook integration will be available soon.', [{ text: 'OK' }]);
  };

  const handleDeleteEvent = async (eventId: string) => {
    const user = auth.currentUser;
    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Authentication required',
        text2: 'Please log in to delete events',
        position: 'top',
      });
      return;
    }

    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'calendarEvents', eventId));
              Toast.show({
                type: 'success',
                text1: 'Event deleted',
                text2: 'The event has been successfully removed',
                position: 'top',
              });
            } catch (error: any) {
              console.error('Error deleting event:', error);
              Toast.show({
                type: 'error',
                text1: 'Delete failed',
                text2: 'Failed to delete event. Please try again.',
                position: 'top',
              });
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView 
      style={styles.container} 
      edges={Platform.OS === 'android' ? ['top', 'bottom'] : ['top']}
    >
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
        {/* Tab Navigation */}
        <View style={styles.tabSection}>
          <TabBar
            tabs={[
              { id: 'month', label: 'Month' },
              { id: 'week', label: 'Week' },
              { id: 'day', label: 'Day' },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </View>

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
        {isLoadingEvents ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : selectedDateEvents.length > 0 ? (
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
                    onPress={() => addEventToGoogleCalendar(event)}
                    activeOpacity={0.7}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <ActivityIndicator size="small" color="#4285F4" />
                    ) : (
                      <Image source={googleLogo} style={styles.eventActionIcon} resizeMode="contain" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.eventActionButton}
                    onPress={handleOutlook}
                    activeOpacity={0.7}
                  >
                    <Feather name="mail" size={22} color="#0078D4" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.eventActionButton}
                    onPress={() => handleDeleteEvent(event.id)}
                    activeOpacity={0.7}
                  >
                    <Feather name="trash-2" size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyDateState}>
            <SvgIcon name="calendar-lines" size={64} color="#D1D5DB" />
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
            style={[
              styles.syncButton,
              styles.googleButton,
              isGoogleConnected && styles.connectedButton,
            ]}
            onPress={handleGoogleCalendar}
            activeOpacity={0.8}
            disabled={isSyncing}
          >
            <View style={styles.syncButtonContent}>
              <View style={styles.syncIconContainer}>
                {isSyncing ? (
                  <ActivityIndicator size="small" color="#4285F4" />
                ) : (
                  <Image source={googleLogo} style={styles.googleLogo} resizeMode="contain" />
                )}
              </View>
              <View style={styles.syncButtonText}>
                <Text style={styles.syncButtonTitle}>
                  {isGoogleConnected ? 'Google Calendar Connected' : 'Add to Google Calendar'}
                </Text>
                <Text style={styles.syncButtonSubtitle}>
                  {isGoogleConnected
                    ? 'Tap to sync events or disconnect'
                    : 'Sync with your Google account'}
                </Text>
              </View>
            </View>
            {isGoogleConnected && (
              <View style={styles.connectedBadge}>
                <Feather name="check-circle" size={20} color="#10B981" />
              </View>
            )}
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
                          backgroundColor: theme.colors.primary,
                          borderColor: theme.colors.primary,
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

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(20),
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
    borderRadius: 32,
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
  tabSection: {
    paddingHorizontal: getResponsivePadding(20),
    marginBottom: 20,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(20),
    marginBottom: Platform.OS === 'android' ? 16 : 24,
  },
  monthNavButton: {
    width: 48,
    height: 48,
    borderRadius: 28,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: Platform.OS === 'android' ? 22 : 24,
    fontWeight: '800',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    textAlign: 'center',
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: Colors.white,
    borderRadius: 28,
    marginHorizontal: Platform.OS === 'android' ? getResponsivePadding(20) : 34,
    marginBottom: Platform.OS === 'android' ? 20 : 22,
    padding: Platform.OS === 'android' ? 16 : 20,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
  },
  dayHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Platform.OS === 'android' ? 8 : 12,
  },
  dayHeader: {
    width: '14%',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'android' ? 10 : 12,
  },
  dayHeaderText: {
    fontSize: Platform.OS === 'android' ? 13 : 15,
    fontWeight: '700',
    color: Colors.coolGrey,
    fontFamily: Fonts.bold,
    textTransform: Platform.OS === 'android' ? 'uppercase' : 'none',
    letterSpacing: Platform.OS === 'android' ? 0.5 : 0,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: '14%', // Approximately 1/7 of the width, accounting for spacing
    aspectRatio: 1,
    minHeight: Platform.OS === 'android' ? 48 : 50,
    maxHeight: Platform.OS === 'android' ? 56 : 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: Platform.OS === 'android' ? 4 : 6,
    position: 'relative',
  },
  emptyCell: {
    opacity: 0,
  },
  todayCell: {
    backgroundColor: Colors.roseLight,
    borderWidth: Platform.OS === 'android' ? 2 : 0,
    borderColor: Colors.roseRed,
  },
  selectedCell: {
    backgroundColor: Colors.roseRed,
  },
  dayText: {
    fontSize: Platform.OS === 'android' ? 16 : 17,
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
    paddingHorizontal: getResponsivePadding(20),
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
    borderRadius: 28,
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
    borderRadius: 28,
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
    paddingHorizontal: getResponsivePadding(20),
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
    borderRadius: 28,
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
    borderRadius: 28,
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 20,
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
    borderRadius: 28,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
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
    borderRadius: 24,
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
    borderRadius: 28,
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
    borderRadius: 24,
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
    borderRadius: 28,
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
  connectedButton: {
    borderLeftColor: '#10B981',
  },
  connectedBadge: {
    marginRight: 8,
  },
});

export default CalendarScreen;