import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SendView } from './SendView';

describe('SendView Component', () => {
  const mockHandleFileSelect = vi.fn();
  const mockHandleFileRemove = vi.fn();
  const mockHandleSendFiles = vi.fn();
  
  const mockCurrentDevice = { id: '1', name: 'Me', socketId: 's1', avatar: 'a1' };
  const mockDevices = [{ id: '2', name: 'Other', socketId: 's2', avatar: 'a2' }];

  it('renders both FileUpload and DeviceList', () => {
    render(
      <SendView
        selectedFiles={[]}
        handleFileSelect={mockHandleFileSelect}
        handleFileRemove={mockHandleFileRemove}
        currentDevice={mockCurrentDevice}
        connectedDevices={mockDevices}
        handleSendFiles={mockHandleSendFiles}
        onShareText={vi.fn()}
        isSending={false}
      />
    );
    // Checking for text from FileUpload and DeviceList
    expect(screen.getByText(/Share Files/i)).toBeInTheDocument();
    expect(screen.getByText(/Nearby Devices/i)).toBeInTheDocument();
  });

  it('passes props correctly to sub-components', () => {
    const mockFiles = [new File([''], 'test.txt')];
    render(
      <SendView
        selectedFiles={mockFiles}
        handleFileSelect={mockHandleFileSelect}
        handleFileRemove={mockHandleFileRemove}
        currentDevice={mockCurrentDevice}
        connectedDevices={mockDevices}
        handleSendFiles={mockHandleSendFiles}
        onShareText={vi.fn()}
        isSending={false}
      />
    );
    expect(screen.getByText('test.txt')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });
});
