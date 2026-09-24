// packages
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

// hooks
import { useQuestionBank } from '../hooks/useQuestionBank';

// components
import { QuestionView } from '../components/question/QuestionView';

export function QuestionPage(): JSX.Element {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const { byId } = useQuestionBank();
  const question = byId.get(id);
  if (question === undefined) {
    return <p>{t('question.notFound')} <Link to="/browse" className="underline">{t('browse.title')}</Link></p>;
  }
  return <QuestionView key={question.id} question={question} />;
}
