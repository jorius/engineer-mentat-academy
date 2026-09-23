// packages
import { Link, useParams } from 'react-router-dom';
import type { JSX } from 'react';

// hooks
import { useQuestionBank } from '../hooks/useQuestionBank';

// components
import { QuestionView } from '../components/question/QuestionView';

export function QuestionPage(): JSX.Element {
  const { id = '' } = useParams();
  const { byId } = useQuestionBank();
  const question = byId.get(id);
  if (question === undefined) {
    return <p>Question not found. <Link to="/browse" className="underline">Browse</Link></p>;
  }
  return <QuestionView key={question.id} question={question} />;
}
