import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';

type TimeSlot = {
  hour: number;
  label: string;
};

type TimeSlotSelectorProps = {
  slots: TimeSlot[];
  selectedSlot?: number;
  onSlotSelect?: (hour: number) => void;
  highlightedRange?: { start: number; end: number };
};

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  slots,
  selectedSlot,
  onSlotSelect,
  highlightedRange,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {slots.map((slot) => {
        const isSelected = selectedSlot === slot.hour;
        const isInRange =
          highlightedRange &&
          slot.hour >= highlightedRange.start &&
          slot.hour < highlightedRange.end;

        return (
          <TouchableOpacity
            key={slot.hour}
            style={[
              styles.slot,
              isInRange && styles.highlightedSlot,
              isSelected && styles.selectedSlot,
            ]}
            onPress={() => onSlotSelect?.(slot.hour)}
            activeOpacity={0.7}
            disabled={!onSlotSelect}
          >
            <Text
              style={[
                styles.slotText,
                isInRange && styles.highlightedSlotText,
                isSelected && styles.selectedSlotText,
              ]}
            >
              {slot.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 8,
  },
  slot: {
    minWidth: 50,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },
  highlightedSlot: {
    backgroundColor: Colors.roseRed,
    borderColor: Colors.roseRed,
  },
  selectedSlot: {
    backgroundColor: Colors.roseDark,
    borderColor: Colors.roseDark,
  },
  slotText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.coolGrey,
    fontFamily: Fonts.semiBold,
  },
  highlightedSlotText: {
    color: Colors.white,
  },
  selectedSlotText: {
    color: Colors.white,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
});

export default TimeSlotSelector;

