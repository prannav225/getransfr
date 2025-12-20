import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Header } from './Header';

describe('Header Component', () => {
  const mockDevice = {
    id: '123',
    name: 'Test Device',
    socketId: 'socket-123',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Test'
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders the logo and brand name', () => {
    render(<Header currentDevice={null} />);
    expect(screen.getByAltText('Getransfr')).toBeInTheDocument();
    expect(screen.getByText('Getransfr')).toBeInTheDocument();
  });

  it('renders the theme toggle button', () => {
    render(<Header currentDevice={null} />);
    expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument();
  });

  it('toggles dark mode when theme button is clicked', () => {
    render(<Header currentDevice={null} />);
    const toggleButton = screen.getByLabelText('Toggle theme');
    
    // Initial state (assuming light mode default in test env)
    fireEvent.click(toggleButton);
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    
    fireEvent.click(toggleButton);
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('displays device info when currentDevice is provided', () => {
    render(<Header currentDevice={mockDevice} />);
    expect(screen.getByText('Test Device')).toBeInTheDocument();
    expect(screen.getByAltText('Test Device')).toHaveAttribute('src', mockDevice.avatar);
  });

  it('does not display device info when currentDevice is null', () => {
    render(<Header currentDevice={null} />);
    expect(screen.queryByText('Connected as')).not.toBeInTheDocument();
  });
});
