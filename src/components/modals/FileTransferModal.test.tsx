import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileTransferModal } from './FileTransferModal';

describe('FileTransferModal Component', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();
  const mockFiles = [
    { name: 'file1.txt', size: 1024, type: 'text/plain' },
    { name: 'file2.jpg', size: 2048 * 1024, type: 'image/jpeg' }
  ];

  it('renders correctly with given files', () => {
    render(
      <FileTransferModal 
        files={mockFiles} 
        onConfirm={mockOnConfirm} 
        onCancel={mockOnCancel} 
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
        onConfirm={mockOnConfirm} 
        onCancel={mockOnCancel} 
      />
    );
    // 1024 + 2048*1024 = 1KB + 2MB = ~2 MB
    // It appears twice: once in the list and once in the summary
    expect(screen.getAllByText('2 MB')[0]).toBeInTheDocument();
  });

  it('calls onConfirm when Accept Transfer button is clicked', () => {
    render(
      <FileTransferModal 
        files={mockFiles} 
        onConfirm={mockOnConfirm} 
        onCancel={mockOnCancel} 
      />
    );
    fireEvent.click(screen.getByText('Accept Transfer'));
    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('calls onCancel when Decline button is clicked', () => {
    render(
      <FileTransferModal 
        files={mockFiles} 
        onConfirm={mockOnConfirm} 
        onCancel={mockOnCancel} 
      />
    );
    fireEvent.click(screen.getByText('Decline'));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
