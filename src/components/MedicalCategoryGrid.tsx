import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';

type Category = {
  id: string;
  name: string;
  isSelected?: boolean;
};

type MedicalCategoryGridProps = {
  categories: Category[];
  onCategorySelect?: (categoryId: string) => void;
  showNextButton?: boolean;
  onNext?: () => void;
};

const MedicalCategoryGrid: React.FC<MedicalCategoryGridProps> = ({
  categories,
  onCategorySelect,
  showNextButton = false,
  onNext,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              category.isSelected && styles.categoryButtonSelected,
            ]}
            onPress={() => onCategorySelect?.(category.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryText,
                category.isSelected && styles.categoryTextSelected,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {showNextButton && (
        <TouchableOpacity
          style={styles.nextButton}
          onPress={onNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Next →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
    minWidth: '30%',
    alignItems: 'center',
  },
  categoryButtonSelected: {
    backgroundColor: Colors.darkSlate,
    borderColor: Colors.darkSlate,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
  },
  categoryTextSelected: {
    color: Colors.white,
  },
  nextButton: {
    backgroundColor: Colors.roseRed,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
});

export default MedicalCategoryGrid;

