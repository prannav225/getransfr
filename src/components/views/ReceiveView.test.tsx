import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReceiveView } from './ReceiveView';

describe('ReceiveView Component', () => {
  const mockDevice = {
    id: '1',
    name: 'Receiver Device',
    socketId: 'socket-1',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Receiver'
  };

  it('renders device name and ready status', () => {
    render(<ReceiveView currentDevice={mockDevice} />);
    expect(screen.getByText('Receiver Device')).toBeInTheDocument();
    expect(screen.getByText('Ready to receive...')).toBeInTheDocument();
  });

  it('renders device avatar', () => {
    render(<ReceiveView currentDevice={mockDevice} />);
    const avatar = screen.getByAltText('Device Avatar');
    expect(avatar).toHaveAttribute('src', mockDevice.avatar);
  });

  it('renders feature labels (Secure, Fast)', () => {
    render(<ReceiveView currentDevice={mockDevice} />);
    expect(screen.getByText('Secure')).toBeInTheDocument();
    expect(screen.getByText('Fast')).toBeInTheDocument();
  });
});
