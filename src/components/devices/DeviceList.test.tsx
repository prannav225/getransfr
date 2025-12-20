import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeviceList } from './DeviceList';
import { Device } from '@/types/device';

describe('DeviceList Component', () => {
  const currentDevice: Device = {
    id: '1',
    name: 'Current Device',
    socketId: 'socket-1',
    avatar: 'avatar-1'
  };

  const otherDevices: Device[] = [
    { id: '2', name: 'Other Device 1', socketId: 'socket-2', avatar: 'avatar-2' },
    { id: '3', name: 'Other Device 2', socketId: 'socket-3', avatar: 'avatar-3' }
  ];

  const mockOnSendFiles = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Scanning for devices..." when no other devices are connected', () => {
    render(
      <DeviceList
        currentDevice={currentDevice}
        connectedDevices={[]}
        onSendFiles={mockOnSendFiles}
        selectedFiles={[]}
        isSending={false}
      />
    );
    expect(screen.getByText('Scanning for devices...')).toBeInTheDocument();
  });

  it('renders list of unique connected devices excluding current device', () => {
    render(
      <DeviceList
        currentDevice={currentDevice}
        connectedDevices={[currentDevice, ...otherDevices]}
        onSendFiles={mockOnSendFiles}
        selectedFiles={[]}
        isSending={false}
      />
    );
    expect(screen.getByText('Other Device 1')).toBeInTheDocument();
    expect(screen.getByText('Other Device 2')).toBeInTheDocument();
    expect(screen.queryByText('Current Device')).not.toBeInTheDocument();
  });

  it('calls onSendFiles when a device is clicked and files are selected', () => {
    const mockFiles = [new File([''], 'test.txt', { type: 'text/plain' })];
    render(
      <DeviceList
        currentDevice={currentDevice}
        connectedDevices={otherDevices}
        onSendFiles={mockOnSendFiles}
        selectedFiles={mockFiles}
        isSending={false}
      />
    );
    
    fireEvent.click(screen.getByText('Other Device 1'));
    expect(mockOnSendFiles).toHaveBeenCalledWith(otherDevices[0]);
  });

  it('disables send buttons when no files are selected', () => {
    render(
      <DeviceList
        currentDevice={currentDevice}
        connectedDevices={otherDevices}
        onSendFiles={mockOnSendFiles}
        selectedFiles={[]}
        isSending={false}
      />
    );
    
    const sendButtons = screen.getAllByRole('button');
    sendButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });
});
