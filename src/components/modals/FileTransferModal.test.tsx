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
    expect(screen.getByText(/Nearby device wants to share/i)).toBeInTheDocument();
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
    // It appears twice: once in the list and once in the summary
    expect(screen.getAllByText('2 MB')[0]).toBeInTheDocument();
  });

  it('calls onAccept when Accept Transfer button is clicked', () => {
    render(
      <FileTransferModal 
        files={mockFiles} 
        onAccept={mockOnAccept} 
        onDecline={mockOnDecline} 
      />
    );
    fireEvent.click(screen.getByText('Accept Transfer'));
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
