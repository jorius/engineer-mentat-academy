// packages
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// components
import { ConfirmDialog } from './ConfirmDialog';

type Callbacks = { onConfirm: () => void; onCancel: () => void };

function renderDialog(options?: { open?: boolean; typeToConfirm?: string }): Callbacks {
  const callbacks: Callbacks = { onConfirm: vi.fn(), onCancel: vi.fn() };
  render(
    <ConfirmDialog
      open={options?.open ?? true}
      title="Delete this drill?"
      body="It is removed from My drills."
      confirmLabel="Delete"
      danger
      typeToConfirm={options?.typeToConfirm}
      {...callbacks}
    />,
  );
  return callbacks;
}

describe('ConfirmDialog', () => {
  it('renders nothing accessible while closed', () => {
    renderDialog({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('names the dialog by its title, describes it by its body and focuses Cancel', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog', { name: 'Delete this drill?' });
    expect(dialog).toHaveAccessibleDescription('It is removed from My drills.');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('bg-red-600');
  });

  it('calls onConfirm from the confirm button and onCancel from Cancel', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderDialog();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('cancels on Esc', () => {
    const { onConfirm, onCancel } = renderDialog();
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('cancels on a backdrop click but not on a click inside', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderDialog();
    await user.click(screen.getByText('It is removed from My drills.'));
    expect(onCancel).not.toHaveBeenCalled();
    await user.click(screen.getByRole('dialog'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('keeps confirm disabled until the typed text matches, ignoring surrounding spaces', async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderDialog({ typeToConfirm: 'RESET' });
    const confirm = screen.getByRole('button', { name: 'Delete' });
    expect(confirm).toBeDisabled();
    const input = screen.getByRole('textbox', { name: 'Type RESET to confirm' });
    await user.type(input, 'RESE');
    expect(confirm).toBeDisabled();
    await user.type(input, 'T  ');
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('starts the typed gate empty each time it opens', async () => {
    const user = userEvent.setup();
    const callbacks: Callbacks = { onConfirm: vi.fn(), onCancel: vi.fn() };
    const props = { title: 'Reset everything?', body: 'Back to defaults.', confirmLabel: 'Reset everything', typeToConfirm: 'RESET', ...callbacks };
    const { rerender } = render(<ConfirmDialog open {...props} />);
    await user.type(screen.getByRole('textbox', { name: 'Type RESET to confirm' }), 'RESET');
    rerender(<ConfirmDialog open={false} {...props} />);
    rerender(<ConfirmDialog open {...props} />);
    expect(screen.getByRole('textbox', { name: 'Type RESET to confirm' })).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Reset everything' })).toBeDisabled();
  });
});
