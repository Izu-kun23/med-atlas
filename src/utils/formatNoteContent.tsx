import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';

export const renderFormattedContent = (content: string) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Header (starts with #)
    if (trimmedLine.startsWith('# ')) {
      const headerText = trimmedLine.substring(2);
      elements.push(
        <Text key={`header-${index}`} style={styles.header}>
          {headerText}
        </Text>
      );
      return;
    }

    // Sub header (starts with ##)
    if (trimmedLine.startsWith('## ')) {
      const subHeaderText = trimmedLine.substring(3);
      elements.push(
        <Text key={`subheader-${index}`} style={styles.subHeader}>
          {subHeaderText}
        </Text>
      );
      return;
    }

    // Bullet point (starts with - or *)
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      const bulletText = trimmedLine.substring(2);
      elements.push(
        <View key={`bullet-${index}`} style={styles.bulletContainer}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{parseInlineFormatting(bulletText)}</Text>
        </View>
      );
      return;
    }

    // Regular line with inline formatting
    if (trimmedLine) {
      elements.push(
        <Text key={`line-${index}`} style={styles.regularText}>
          {parseInlineFormatting(trimmedLine)}
        </Text>
      );
    } else {
      // Empty line for spacing
      elements.push(<View key={`spacer-${index}`} style={styles.spacer} />);
    }
  });

  return elements.length > 0 ? <View>{elements}</View> : null;
};

const parseInlineFormatting = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  let key = 0;

  // Match underline: __text__
  const underlineRegex = /__([^_]+)__/g;
  let match;

  while ((match = underlineRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > currentIndex) {
      parts.push(
        <Text key={`text-${key++}`} style={styles.regularText}>
          {text.substring(currentIndex, match.index)}
        </Text>
      );
    }

    // Add underlined text
    parts.push(
      <Text key={`underline-${key++}`} style={styles.underlinedText}>
        {match[1]}
      </Text>
    );

    currentIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    parts.push(
      <Text key={`text-${key++}`} style={styles.regularText}>
        {text.substring(currentIndex)}
      </Text>
    );
  }

  return parts.length > 0 ? parts : [<Text key="text-0">{text}</Text>];
};

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginTop: 24,
    marginBottom: 12,
    lineHeight: 32,
  },
  subHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginTop: 20,
    marginBottom: 10,
    lineHeight: 28,
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 17,
    color: Colors.roseRed,
    marginRight: 12,
    fontFamily: Fonts.bold,
  },
  bulletText: {
    flex: 1,
    fontSize: 17,
    color: Colors.darkSlate,
    fontFamily: Fonts.regular,
    lineHeight: 28,
  },
  regularText: {
    fontSize: 17,
    color: Colors.darkSlate,
    fontFamily: Fonts.regular,
    lineHeight: 28,
    marginBottom: 8,
  },
  underlinedText: {
    fontSize: 17,
    color: Colors.darkSlate,
    fontFamily: Fonts.regular,
    lineHeight: 28,
    textDecorationLine: 'underline',
  },
  spacer: {
    height: 12,
  },
});

