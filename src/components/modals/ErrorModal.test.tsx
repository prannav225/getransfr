import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorModal } from './ErrorModal';

describe('ErrorModal Component', () => {
  const mockOnClose = vi.fn();
  const testMessage = 'Something went wrong';

  it('renders the error message', () => {
    render(<ErrorModal message={testMessage} onClose={mockOnClose} />);
    expect(screen.getByText(testMessage)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ErrorModal message={testMessage} onClose={mockOnClose} />);
    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when X button is clicked', () => {
    render(<ErrorModal message={testMessage} onClose={mockOnClose} />);
    const xBtn = screen.getByRole('button', { name: '' }); // X icon button doesn't have text
    fireEvent.click(xBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });
});
