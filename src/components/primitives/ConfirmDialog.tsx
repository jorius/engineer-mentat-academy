// packages
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { JSX, Ref, SyntheticEvent } from 'react';

// components
import { Button } from './Button';

type Props = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  typeToConfirm?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

type ContentProps = Omit<Props, 'open'> & { titleId: string; bodyId: string; cancelRef: Ref<HTMLButtonElement> };

/** The dialog's inside; mounted only while open, so the typed gate starts empty each time. */
function ConfirmContent({ title, body, confirmLabel, cancelLabel, danger = false, typeToConfirm, onConfirm, onCancel, titleId, bodyId, cancelRef }: ContentProps): JSX.Element {
  const { t } = useTranslation();
  const [typed, setTyped] = useState<string>('');
  const blocked = typeToConfirm !== undefined && typed.trim() !== typeToConfirm;

  return (
    <div className="space-y-3 p-4">
      <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
      <p id={bodyId} className="text-sm text-zinc-600 dark:text-zinc-300">{body}</p>
      {typeToConfirm === undefined ? null : (
        <input
          type="text"
          aria-label={t('settings.typeToConfirm')}
          placeholder={typeToConfirm}
          value={typed}
          onChange={(e): void => setTyped(e.target.value)}
          className="w-40 rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button ref={cancelRef} variant="ghost" onClick={onCancel}>{cancelLabel ?? t('common.cancel')}</Button>
        <Button variant={danger ? 'danger' : 'primary'} disabled={blocked} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </div>
  );
}

/**
 * A native modal `<dialog>` that asks before a destructive action runs. Esc, a backdrop click and
 * Cancel call `onCancel`; Cancel takes the initial focus so Enter never confirms by accident.
 */
export function ConfirmDialog({ open, onCancel, ...rest }: Props): JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return;
    }
    if (open) {
      if (!dialog.open) {
        // jsdom has no showModal; the open attribute is enough there.
        if (typeof dialog.showModal === 'function') {
          dialog.showModal();
        } else {
          dialog.setAttribute('open', '');
        }
      }
      cancelRef.current?.focus();
    } else if (dialog.open) {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
    }
  }, [open]);

  const cancel = (event: SyntheticEvent<HTMLDialogElement>): void => {
    // The browser would close the dialog itself; the parent's `open` prop decides instead.
    event.preventDefault();
    onCancel();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
      onCancel={cancel}
      onClose={(): void => {
        // A close the parent did not ask for (Esc without a cancel event) still counts as Cancel.
        if (open) {
          onCancel();
        }
      }}
      onClick={(event): void => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      {open ? <ConfirmContent {...rest} onCancel={onCancel} titleId={titleId} bodyId={bodyId} cancelRef={cancelRef} /> : null}
    </dialog>
  );
}
