import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BottomNav } from './BottomNav';

describe('BottomNav Component', () => {
  const mockOnTabChange = vi.fn();

  it('renders both Send and Receive buttons', () => {
    render(<BottomNav activeTab="send" onTabChange={mockOnTabChange} />);
    expect(screen.getByText('Send')).toBeInTheDocument();
    expect(screen.getByText('Receive')).toBeInTheDocument();
  });

  it('calls onTabChange with "receive" when Receive button is clicked', () => {
    render(<BottomNav activeTab="send" onTabChange={mockOnTabChange} />);
    const receiveBtn = screen.getByText('Receive').closest('button');
    if (receiveBtn) {
      fireEvent.click(receiveBtn);
      expect(mockOnTabChange).toHaveBeenCalledWith('receive');
    }
  });

  it('calls onTabChange with "send" when Send button is clicked', () => {
    render(<BottomNav activeTab="receive" onTabChange={mockOnTabChange} />);
    const sendBtn = screen.getByText('Send').closest('button');
    if (sendBtn) {
      fireEvent.click(sendBtn);
      expect(mockOnTabChange).toHaveBeenCalledWith('send');
    }
  });

  it('applies active styles correctly based on activeTab prop', () => {
    const { rerender } = render(<BottomNav activeTab="send" onTabChange={mockOnTabChange} />);
    let sendBtn = screen.getByText('Send').closest('button');
    expect(sendBtn).toHaveClass('text-white');
    
    rerender(<BottomNav activeTab="receive" onTabChange={mockOnTabChange} />);
    let receiveBtn = screen.getByText('Receive').closest('button');
    expect(receiveBtn).toHaveClass('text-white');
  });
});
