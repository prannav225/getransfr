import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileUpload } from './FileUpload';

describe('FileUpload Component', () => {
  const mockOnFileSelect = vi.fn();
  const mockOnFileRemove = vi.fn();
  
  const mockFiles = [
    new File(['hello'], 'hello.txt', { type: 'text/plain' }),
    new File(['world'], 'world.png', { type: 'image/png' })
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders correctly with no files selected', () => {
    render(
      <FileUpload
        selectedFiles={[]}
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
      />
    );
    expect(screen.getByText(/Drop files here/i)).toBeInTheDocument();
  });

  it('displays selected files with their names and sizes', () => {
    render(
      <FileUpload
        selectedFiles={mockFiles}
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
      />
    );
    expect(screen.getByText('hello.txt')).toBeInTheDocument();
    expect(screen.getByText('world.png')).toBeInTheDocument();
    // Size check: "hello" is 5 bytes, so 0.00 MB
    expect(screen.getAllByText('0.00 MB')).toHaveLength(2);
  });

  it('calls onFileRemove when remove button is clicked', () => {
    render(
      <FileUpload
        selectedFiles={mockFiles}
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
      />
    );
    const removeButtons = screen.getAllByRole('button').filter(btn => !btn.getAttribute('aria-label')?.includes('Toggle'));
    fireEvent.click(removeButtons[0]);
    expect(mockOnFileRemove).toHaveBeenCalledWith(0);
  });

  it('calls onFileSelect when a file is uploaded via input', () => {
    render(
      <FileUpload
        selectedFiles={[]}
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
      />
    );
    const input = screen.getByLabelText(/or click to browse/i).parentElement?.querySelector('input');
    if (input) {
      fireEvent.change(input, { target: { files: [mockFiles[0]] } });
      expect(mockOnFileSelect).toHaveBeenCalled();
    }
  });

  it('handles drag over and drag leave correctly', () => {
    render(
      <FileUpload
        selectedFiles={[]}
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
      />
    );
    const dropzone = screen.getByText(/Drop files here/i).closest('.border-2');
    if (dropzone) {
      fireEvent.dragOver(dropzone);
      expect(dropzone).toHaveClass('border-primary');
      fireEvent.dragLeave(dropzone);
      expect(dropzone).not.toHaveClass('border-primary');
    }
  });
});
