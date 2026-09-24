// packages
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { indentWithTab } from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { sql } from '@codemirror/lang-sql';
import type { JSX } from 'react';

// contexts
import { useTheme } from '../../contexts/ThemeContext';

// engine
import { editorThemeExtension } from '../../engine/editorThemes';

// hooks
import { usePreferences } from '../../hooks/usePreferences';

export type EditorLanguage = 'javascript' | 'typescript' | 'sql';

type Props = { value: string; onChange: (value: string) => void; language: EditorLanguage; readOnly?: boolean; ariaLabel?: string; minLines?: number };

const LINE_HEIGHT_RATIO = 1.5;

function languageExtension(language: EditorLanguage): ReturnType<typeof javascript> {
  if (language === 'sql') {
    return sql();
  }
  return javascript({ typescript: language === 'typescript' });
}

export function CodeEditor({ value, onChange, language, readOnly = false, ariaLabel, minLines }: Props): JSX.Element {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const { t } = useTranslation();
  const label = ariaLabel ?? t('question.codeEditor');
  const { theme } = useTheme();
  const { preferences } = usePreferences();
  const { editorFont, editorFontSize, tabSize, indentWithTabs, editorTheme } = preferences;

  useEffect(() => {
    if (host.current === null) {
      return;
    }
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        languageExtension(language),
        editorThemeExtension(editorTheme, theme),
        EditorState.readOnly.of(readOnly),
        EditorState.tabSize.of(tabSize),
        indentUnit.of(indentWithTabs ? '\t' : ' '.repeat(tabSize)),
        keymap.of([indentWithTab]),
        EditorView.theme({
          '&': { fontSize: `${editorFontSize}px`, ...(minLines === undefined ? {} : { minHeight: `${Math.round(minLines * editorFontSize * LINE_HEIGHT_RATIO)}px` }) },
          '.cm-content': { fontFamily: 'var(--editor-font, ui-monospace, monospace)' },
        }),
        EditorView.updateListener.of((update): void => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.contentAttributes.of({ 'aria-label': label }),
      ],
    });
    view.current = new EditorView({ state, parent: host.current });
    return (): void => {
      view.current?.destroy();
      view.current = null;
    };
    // The editor is recreated only when language, theme, readOnly, its label or these preferences change; `value` is the initial doc.
    // The font itself comes from --editor-font; editorFont stays listed so a new face is measured by a fresh view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, theme, readOnly, label, editorFont, editorFontSize, tabSize, indentWithTabs, editorTheme, minLines]);

  useEffect(() => {
    const current = view.current;
    if (current !== null && current.state.doc.toString() !== value) {
      current.dispatch({ changes: { from: 0, to: current.state.doc.length, insert: value } });
    }
  }, [value]);

  return <div ref={host} className="min-h-[160px]" />;
}
