import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';

type FormattedTextEditorProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  onSelectionChange?: (selection: { start: number; end: number }) => void;
  subjectColor?: string;
};

const FormattedTextEditor: React.FC<FormattedTextEditorProps> = ({
  value,
  onChangeText,
  placeholder,
  placeholderTextColor,
  onSelectionChange,
  subjectColor = Colors.roseRed,
}) => {
  const inputRef = useRef<TextInput>(null);
  const [displayValue, setDisplayValue] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  // Convert markdown to display format (hide # symbols)
  useEffect(() => {
    if (!value) {
      setDisplayValue('');
      return;
    }
    
    const lines = value.split('\n');
    const displayLines = lines.map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return line.replace(/^#\s*/, '');
      } else if (trimmed.startsWith('## ')) {
        return line.replace(/^##\s*/, '');
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return line.replace(/^[-*]\s*/, '');
      }
      return line;
    });
    
    setDisplayValue(displayLines.join('\n'));
  }, [value]);

  // Convert display format back to markdown
  const convertToMarkdown = (displayText: string): string => {
    if (!value) return displayText;
    
    const originalLines = value.split('\n');
    const displayLines = displayText.split('\n');
    
    return displayLines.map((displayLine, index) => {
      const originalLine = originalLines[index] || '';
      const trimmed = originalLine.trim();
      
      if (trimmed.startsWith('# ')) {
        // Preserve header format
        return '# ' + displayLine;
      } else if (trimmed.startsWith('## ')) {
        // Preserve subheader format
        return '## ' + displayLine;
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        // Preserve bullet format
        return '- ' + displayLine;
      }
      return displayLine;
    }).join('\n');
  };

  const handleTextChange = (text: string) => {
    setDisplayValue(text);
    const markdownText = convertToMarkdown(text);
    onChangeText(markdownText);
  };

  // Parse and render formatted content
  const renderFormattedText = () => {
    if (!value) {
      return (
        <Text style={[styles.placeholder, { color: placeholderTextColor || Colors.coolGrey }]}>
          {placeholder || 'Note Content'}
        </Text>
      );
    }

    const lines = value.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, lineIndex) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('# ')) {
        const text = trimmed.substring(2);
        elements.push(
          <Text key={`line-${lineIndex}`} style={styles.headerText}>
            {text}
            {lineIndex < lines.length - 1 ? '\n' : ''}
          </Text>
        );
      } else if (trimmed.startsWith('## ')) {
        const text = trimmed.substring(3);
        elements.push(
          <Text key={`line-${lineIndex}`} style={styles.subHeaderText}>
            {text}
            {lineIndex < lines.length - 1 ? '\n' : ''}
          </Text>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const text = trimmed.substring(2);
        elements.push(
          <View key={`line-${lineIndex}`} style={styles.bulletRow}>
            <Text style={[styles.bullet, { color: subjectColor }]}>•</Text>
            <Text style={styles.bulletText}>{parseInlineFormatting(text)}</Text>
          </View>
        );
      } else if (trimmed) {
        elements.push(
          <Text key={`line-${lineIndex}`} style={styles.normalText}>
            {parseInlineFormatting(trimmed)}
            {lineIndex < lines.length - 1 ? '\n' : ''}
          </Text>
        );
      } else {
        elements.push(<Text key={`line-${lineIndex}`}>{'\n'}</Text>);
      }
    });

    return <View>{elements}</View>;
  };

  const parseInlineFormatting = (text: string): React.ReactNode => {
    if (!text.includes('__')) {
      return text;
    }

    const parts: React.ReactNode[] = [];
    const regex = /__([^_]+)__/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <Text key={`text-${key++}`}>
            {text.substring(lastIndex, match.index)}
          </Text>
        );
      }
      parts.push(
        <Text key={`underline-${key++}`} style={styles.underlinedText}>
          {match[1]}
        </Text>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(
        <Text key={`text-${key++}`}>
          {text.substring(lastIndex)}
        </Text>
      );
    }

    return <Text>{parts}</Text>;
  };

  return (
    <View style={styles.container}>
      {/* Formatted display overlay */}
      <View style={styles.formattedOverlay} pointerEvents="none">
        {renderFormattedText()}
      </View>
      {/* Transparent TextInput for editing */}
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={displayValue}
        onChangeText={handleTextChange}
        onSelectionChange={(e) => {
          const sel = {
            start: e.nativeEvent.selection.start,
            end: e.nativeEvent.selection.end,
          };
          setSelection(sel);
          onSelectionChange?.(sel);
        }}
        multiline
        textAlignVertical="top"
        placeholder={placeholder}
        placeholderTextColor="transparent"
        caretHidden={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 200,
    position: 'relative',
  },
  formattedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 0,
    zIndex: 0,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    fontSize: 17,
    color: 'transparent',
    fontFamily: Fonts.regular,
    lineHeight: 28,
    padding: 0,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  placeholder: {
    fontSize: 17,
    fontFamily: Fonts.regular,
    lineHeight: 28,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginTop: 16,
    marginBottom: 8,
    lineHeight: 32,
  },
  subHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginTop: 12,
    marginBottom: 6,
    lineHeight: 28,
  },
  normalText: {
    fontSize: 17,
    color: Colors.darkSlate,
    fontFamily: Fonts.regular,
    lineHeight: 28,
    marginBottom: 8,
  },
  underlinedText: {
    textDecorationLine: 'underline',
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 17,
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
  emptyLine: {
    height: 12,
  },
});

export default FormattedTextEditor;
