// packages
import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import type { JSX } from 'react';

// contexts
import { useTheme } from '../../contexts/ThemeContext';

export type EditorLanguage = 'javascript' | 'typescript' | 'sql';

type Props = { value: string; onChange: (value: string) => void; language: EditorLanguage; readOnly?: boolean; ariaLabel?: string };

function languageExtension(language: EditorLanguage): ReturnType<typeof javascript> {
  if (language === 'sql') {
    return sql();
  }
  return javascript({ typescript: language === 'typescript' });
}

export function CodeEditor({ value, onChange, language, readOnly = false, ariaLabel = 'Code editor' }: Props): JSX.Element {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const { theme } = useTheme();

  useEffect(() => {
    if (host.current === null) {
      return;
    }
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        languageExtension(language),
        ...(theme === 'dark' ? [oneDark] : []),
        EditorState.readOnly.of(readOnly),
        EditorView.updateListener.of((update): void => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.contentAttributes.of({ 'aria-label': ariaLabel }),
      ],
    });
    view.current = new EditorView({ state, parent: host.current });
    return (): void => {
      view.current?.destroy();
      view.current = null;
    };
    // The editor is recreated only when language, theme or readOnly change; `value` is the initial doc.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, theme, readOnly]);

  useEffect(() => {
    const current = view.current;
    if (current !== null && current.state.doc.toString() !== value) {
      current.dispatch({ changes: { from: 0, to: current.state.doc.length, insert: value } });
    }
  }, [value]);

  return <div ref={host} className="min-h-[160px]" />;
}
