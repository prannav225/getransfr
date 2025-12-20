import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransferProgress } from './TransferProgress';

describe('TransferProgress Component', () => {
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not sending and no active transfers', () => {
    const { container } = render(
      <TransferProgress progress={0} isSending={false} onCancel={mockOnCancel} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders progress bar when sending files', () => {
    render(
      <TransferProgress progress={45} isSending={true} onCancel={mockOnCancel} />
    );
    expect(screen.getByText('Sending Files...')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked during sending', () => {
    render(
      <TransferProgress progress={45} isSending={true} onCancel={mockOnCancel} />
    );
    const cancelBtn = screen.getByLabelText('Cancel sending');
    fireEvent.click(cancelBtn);
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows "Transfer Complete" when progress is 100%', () => {
    render(
      <TransferProgress progress={100} isSending={true} onCancel={mockOnCancel} />
    );
    expect(screen.getByText('Transfer Complete')).toBeInTheDocument();
  });

  it('responds to file-transfer-start event', () => {
    render(
      <TransferProgress progress={0} isSending={false} onCancel={mockOnCancel} />
    );
    
    const startEvent = new CustomEvent('file-transfer-start', {
      detail: { peerId: 'peer-1', totalSize: 1024 * 1024 }
    });
    fireEvent(window, startEvent);
    
    expect(screen.getByText('Receiving Files...')).toBeInTheDocument();
  });
});
