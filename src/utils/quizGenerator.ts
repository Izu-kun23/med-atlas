/**
 * Quiz Generator Utility
 * Generates quiz questions from notes using simple text extraction
 */

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct answer
  explanation: string;
  sourceNote?: string;
};

/**
 * Generates quiz questions from notes
 * Uses simple keyword extraction and question formation
 */
export function generateQuizFromNotes(
  notes: Array<{ title: string; content: string }>,
  numQuestions: number = 10
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const processedNotes = notes.filter((note) => note.content && note.content.trim().length > 20);

  if (processedNotes.length === 0) {
    return [];
  }

  // Extract key concepts and facts from notes
  const concepts: Array<{ concept: string; definition: string; noteTitle: string }> = [];

  processedNotes.forEach((note) => {
    const sentences = note.content
      .split(/[.!?]\s+/)
      .filter((s) => s.trim().length > 20 && s.trim().length < 200);

    sentences.forEach((sentence) => {
      // Look for definition patterns (e.g., "X is Y", "X refers to Y", "X means Y")
      const definitionPatterns = [
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+is\s+(.+?)(?:\.|$)/i,
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+refers\s+to\s+(.+?)(?:\.|$)/i,
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+means\s+(.+?)(?:\.|$)/i,
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+are\s+(.+?)(?:\.|$)/i,
      ];

      for (const pattern of definitionPatterns) {
        const match = sentence.match(pattern);
        if (match && match[1] && match[2]) {
          concepts.push({
            concept: match[1].trim(),
            definition: match[2].trim(),
            noteTitle: note.title,
          });
          break;
        }
      }

      // Look for "What is X?" patterns
      const whatIsPattern = /What\s+is\s+([a-z]+(?:\s+[a-z]+)*)\?/i;
      const whatIsMatch = sentence.match(whatIsPattern);
      if (whatIsMatch) {
        // Find the answer in the next sentence or same sentence
        const answerMatch = sentence.match(/is\s+(.+?)(?:\.|$)/i);
        if (answerMatch) {
          concepts.push({
            concept: whatIsMatch[1].trim(),
            definition: answerMatch[1].trim(),
            noteTitle: note.title,
          });
        }
      }
    });
  });

  // Generate questions from concepts
  const usedConcepts = new Set<string>();
  let questionId = 1;

  for (const concept of concepts) {
    if (questions.length >= numQuestions) break;
    if (usedConcepts.has(concept.concept)) continue;

    // Generate question: "What is [concept]?"
    const question = `What is ${concept.concept}?`;
    
    // Generate options
    const options = [concept.definition];
    
    // Add distractors from other concepts
    const otherConcepts = concepts
      .filter((c) => c.concept !== concept.concept && !usedConcepts.has(c.concept))
      .slice(0, 3);
    
    otherConcepts.forEach((c) => {
      if (options.length < 4) {
        options.push(c.definition);
      }
    });

    // If we don't have enough options, add generic distractors
    const genericDistractors = ['A medical condition', 'A treatment method', 'A diagnostic tool', 'A clinical procedure'];
    while (options.length < 4) {
      const distractor = genericDistractors[options.length % genericDistractors.length];
      if (!options.includes(distractor)) {
        options.push(distractor);
      } else {
        options.push(`Option ${options.length + 1}`);
      }
    }

    // Ensure we only have exactly 4 options
    const limitedOptions = options.slice(0, 4);
    
    // Shuffle options
    const shuffledOptions = shuffleArray([...limitedOptions]);
    const correctAnswerIndex = shuffledOptions.indexOf(concept.definition);

    if (correctAnswerIndex !== -1) {
      questions.push({
        id: `q${questionId++}`,
        question,
        options: shuffledOptions,
        correctAnswer: correctAnswerIndex,
        explanation: `According to your notes: ${concept.definition}`,
        sourceNote: concept.noteTitle,
      });

      usedConcepts.add(concept.concept);
    }
  }

  // If we don't have enough questions, generate fill-in-the-blank style questions
  if (questions.length < numQuestions) {
    processedNotes.forEach((note) => {
      if (questions.length >= numQuestions) return;

      const sentences = note.content
        .split(/[.!?]\s+/)
        .filter((s) => s.trim().length > 30 && s.trim().length < 150);

      sentences.forEach((sentence) => {
        if (questions.length >= numQuestions) return;

        // Extract key terms (capitalized words or medical terms)
        const keyTerms = sentence.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g);
        
        if (keyTerms && keyTerms.length > 0) {
          const term = keyTerms[0];
          const question = sentence.replace(term, '______');
          
          if (question.length > 20 && question.length < 200) {
            const options = [term];
            
            // Add other terms from the sentence as distractors
            keyTerms.slice(1, 4).forEach((t) => {
              if (options.length < 4) {
                options.push(t);
              }
            });

            // Fill with generic options if needed
            const genericOptions = ['Unknown', 'N/A', 'Various', 'Other'];
            while (options.length < 4) {
              const generic = genericOptions[options.length % genericOptions.length];
              if (!options.includes(generic)) {
                options.push(generic);
              } else {
                options.push(`Option ${options.length + 1}`);
              }
            }

            // Ensure we only have exactly 4 options
            const limitedOptions = options.slice(0, 4);
            
            const shuffledOptions = shuffleArray([...limitedOptions]);
            const correctAnswerIndex = shuffledOptions.indexOf(term);

            if (correctAnswerIndex !== -1) {
              questions.push({
                id: `q${questionId++}`,
                question: `Fill in the blank: ${question}`,
                options: shuffledOptions,
                correctAnswer: correctAnswerIndex,
                explanation: `The correct term is: ${term}`,
                sourceNote: note.title,
              });
            }
          }
        }
      });
    });
  }

  return questions.slice(0, numQuestions);
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

