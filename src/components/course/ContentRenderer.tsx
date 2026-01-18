import { useState } from 'react';

interface Chapter {
  _id: string;
  title: string;
  type: 'video' | 'text' | 'quiz' | 'pdf';
  content: string;
  questions?: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
  isFree: boolean;
  order: number;
}

interface ContentRendererProps {
  chapter: Chapter | null;
  sectionTitle: string;
  chapterNumber: string;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export default function ContentRenderer({
  chapter,
  sectionTitle,
  chapterNumber,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext
}: ContentRendererProps) {
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  if (!chapter) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-bold mb-2">Select a Chapter</h3>
          <p className="text-slate-500 dark:text-slate-400">
            Choose a chapter from the sidebar to view its content
          </p>
        </div>
      </div>
    );
  }

  const handleQuizSubmit = () => {
    if (!chapter.questions) return;
    
    let score = 0;
    chapter.questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctAnswer) {
        score++;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const handleQuizReset = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  const renderContent = () => {
    switch (chapter.type) {
      case 'video':
        if (!chapter.content) {
          return (
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-12 text-center">
              <div className="text-4xl mb-4">🎥</div>
              <p className="text-slate-600 dark:text-slate-400">
                No video uploaded yet
              </p>
            </div>
          );
        }
        return (
          <div className="bg-black rounded-lg overflow-hidden">
            <video
              key={chapter._id}
              src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${chapter.content}`}
              controls
              className="w-full aspect-video"
              controlsList="nodownload"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'text':
        if (!chapter.content) {
          return (
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-12 text-center">
              <div className="text-4xl mb-4">📄</div>
              <p className="text-slate-600 dark:text-slate-400">
                No text content added yet
              </p>
            </div>
          );
        }
        return (
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="bg-white dark:bg-slate-950 rounded-lg p-8 border border-slate-200 dark:border-slate-800">
              <div className="whitespace-pre-wrap">{chapter.content}</div>
            </div>
          </div>
        );

      case 'quiz':
        if (!chapter.questions || chapter.questions.length === 0) {
            return (
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-12 text-center">
                  <div className="text-4xl mb-4">❓</div>
                  <p className="text-slate-600 dark:text-slate-400">
                    No questions in this quiz
                  </p>
                </div>
              );
        }
        
        return (
          <div className="w-full mx-auto space-y-8">
            <div className="bg-white dark:bg-slate-950 rounded-xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{chapter.title}</h2>
                    {quizSubmitted && (
                        <div className={`px-4 py-2 rounded-lg font-bold text-lg ${
                            quizScore / chapter.questions.length >= 0.7 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                            Score: {quizScore} / {chapter.questions.length} ({Math.round((quizScore / chapter.questions.length) * 100)}%)
                        </div>
                    )}
                </div>

                <div className="space-y-8">
                    {chapter.questions.map((q, idx) => {
                        const isCorrect = quizSubmitted && quizAnswers[idx] === q.correctAnswer;
                        const isWrong = quizSubmitted && quizAnswers[idx] !== undefined && quizAnswers[idx] !== q.correctAnswer;
                        
                        return (
                            <div key={idx} className={`p-6 rounded-lg border-2 transition-colors ${
                                quizSubmitted 
                                    ? isCorrect 
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
                                        : isWrong 
                                            ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                                            : 'border-slate-200 dark:border-slate-800 opacity-75'
                                    : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50'
                            }`}>
                                <h3 className="text-lg font-medium mb-4 flex gap-3">
                                    <span className="text-slate-400 shrink-0">{idx + 1}.</span>
                                    {q.question}
                                </h3>
                                <div className="space-y-3 pl-8">
                                    {q.options.map((option, optIdx) => (
                                        <label 
                                            key={optIdx} 
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                                quizAnswers[idx] === optIdx
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm ring-1 ring-blue-500'
                                                    : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                                            } ${quizSubmitted && optIdx === q.correctAnswer ? '!bg-green-100 dark:!bg-green-900/50 !border-green-500 !text-green-900 dark:!text-green-100' : ''}`}
                                        >
                                            <input
                                                type="radio"
                                                name={`question-${idx}`}
                                                checked={quizAnswers[idx] === optIdx}
                                                onChange={() => !quizSubmitted && setQuizAnswers(prev => ({...prev, [idx]: optIdx}))}
                                                disabled={quizSubmitted}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="text-sm">{option}</span>
                                            {quizSubmitted && optIdx === q.correctAnswer && (
                                                <span className="ml-auto text-green-600 dark:text-green-400 text-sm font-bold">✓ Correct</span>
                                            )}
                                            {quizSubmitted && quizAnswers[idx] === optIdx && quizAnswers[idx] !== q.correctAnswer && (
                                                <span className="ml-auto text-red-600 dark:text-red-400 text-sm font-bold">✗ Your Answer</span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 flex justify-end">
                    {!quizSubmitted ? (
                        <button
                            onClick={handleQuizSubmit}
                            disabled={Object.keys(quizAnswers).length !== chapter.questions.length}
                            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Submit Quiz
                        </button>
                    ) : (
                        <button
                            onClick={handleQuizReset}
                            className="px-6 py-3 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                            Retake Quiz
                        </button>
                    )}
                </div>
            </div>
          </div>
        );

      case 'pdf':
        if (!chapter.content) {
          return (
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-12 text-center h-full flex flex-col justify-center">
              <div className="text-4xl mb-4">📄</div>
              <p className="text-slate-600 dark:text-slate-400">
                No PDF document uploaded yet
              </p>
            </div>
          );
        }
        return (
          <div className="h-full bg-white dark:bg-slate-950 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
            <iframe 
                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${chapter.content}`}
                className="w-full h-full"
                title="PDF Viewer"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
