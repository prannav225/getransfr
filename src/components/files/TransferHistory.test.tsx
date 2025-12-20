import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { TransferHistory } from './TransferHistory';

describe('TransferHistory Component', () => {
  const mockHistory = [
    {
      id: '1',
      fileName: 'test.jpg',
      fileType: 'image/jpeg',
      size: 1024,
      timestamp: new Date().toISOString(),
      type: 'sent',
      deviceName: 'Device A'
    },
    {
      id: '2',
      fileName: 'doc.pdf',
      fileType: 'application/pdf',
      size: 2048,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: 'received',
      deviceName: 'Device B'
    }
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  it('renders correctly with empty history', () => {
    render(<TransferHistory />);
    expect(screen.getByText('Transfer History')).toBeInTheDocument();
  });

  it('loads and displays history from localStorage', () => {
    localStorage.setItem('transferHistory', JSON.stringify(mockHistory));
    render(<TransferHistory />);
    
    expect(screen.getByText('test.jpg')).toBeInTheDocument();
    expect(screen.getByText(/Sent to Device A/i)).toBeInTheDocument();
    expect(screen.getByText('doc.pdf')).toBeInTheDocument();
    expect(screen.getByText(/Received from Device B/i)).toBeInTheDocument();
  });
});
