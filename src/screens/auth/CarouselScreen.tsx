import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts } from '../../constants/fonts';
import { Colors } from '../../constants/colors';

type Slide = {
  key: string;
  title: string;
  subtitle: string;
  image: ReturnType<typeof require>;
};

type CarouselScreenProps = {
  onDone?: () => void;
};

const slides: Slide[] = [
  {
    key: 'headline-1',
    title: 'Manage Workload Efficiently',
    subtitle: 'Track rotations, lectures, and clinical duties without missing a beat.',
    image: require('../../../assets/illustrations/illustration1.png'),
  },
  {
    key: 'headline-2',
    title: 'Focus Better Every Day',
    subtitle: 'Guided study sessions and smart reminders keep you exam-ready.',
    image: require('../../../assets/illustrations/illustration2.png'),
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CarouselScreen: React.FC<CarouselScreenProps> = ({ onDone }) => {
  const listRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setActiveIndex(nextIndex);
    },
    []
  );

  const handleNextPress = useCallback(() => {
    const nextIndex = activeIndex + 1;
    if (nextIndex < slides.length) {
      listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      onDone?.();
    }
  }, [activeIndex, onDone]);

  const footerButtonLabel = useMemo(
    () => (activeIndex === slides.length - 1 ? 'Get Started' : 'Next'),
    [activeIndex]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <Image source={item.image} style={styles.image} resizeMode="contain" />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
      />

      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {slides.map((slide, index) => (
            <View
              key={slide.key}
              style={[
                styles.dot,
                activeIndex === index ? styles.dotActive : undefined,
              ]}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={handleNextPress} activeOpacity={0.85}>
          <Text style={styles.buttonText}>{footerButtonLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  image: {
    width: SCREEN_WIDTH * 0.75,
    height: SCREEN_WIDTH * 0.75,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1F2937',
    marginBottom: 12,
    fontFamily: Fonts.semiBold,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#4B5563',
    fontFamily: Fonts.regular,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: Colors.roseRed,
    width: 20,
  },
  button: {
    backgroundColor: Colors.roseRed,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
});

export default CarouselScreen;
