import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileTransferModal } from './FileTransferModal';

describe('FileTransferModal Component', () => {
  const mockOnAccept = vi.fn();
  const mockOnDecline = vi.fn();
  const mockFiles = [
    { name: 'file1.txt', size: 1024, type: 'text/plain' },
    { name: 'file2.jpg', size: 2048 * 1024, type: 'image/jpeg' }
  ];

  it('renders correctly with given files', () => {
    render(
      <FileTransferModal 
        files={mockFiles} 
        onAccept={mockOnAccept} 
        onDecline={mockOnDecline} 
      />
    );
    expect(screen.getByText(/Someone wants to share 2 files with you/i)).toBeInTheDocument();
    expect(screen.getByText('file1.txt')).toBeInTheDocument();
    expect(screen.getByText('file2.jpg')).toBeInTheDocument();
  });

  it('calculates and displays total size correctly', () => {
    render(
      <FileTransferModal 
        files={mockFiles} 
        onAccept={mockOnAccept} 
        onDecline={mockOnDecline} 
      />
    );
    // 1024 + 2048*1024 = 1KB + 2MB = ~2 MB
    expect(screen.getByText(/Total size: 2 MB/i)).toBeInTheDocument();
  });

  it('calls onAccept when Accept button is clicked', () => {
    render(
      <FileTransferModal 
        files={mockFiles} 
        onAccept={mockOnAccept} 
        onDecline={mockOnDecline} 
      />
    );
    fireEvent.click(screen.getByText('Accept'));
    expect(mockOnAccept).toHaveBeenCalled();
  });

  it('calls onDecline when Decline button is clicked', () => {
    render(
      <FileTransferModal 
        files={mockFiles} 
        onAccept={mockOnAccept} 
        onDecline={mockOnDecline} 
      />
    );
    fireEvent.click(screen.getByText('Decline'));
    expect(mockOnDecline).toHaveBeenCalled();
  });
});
