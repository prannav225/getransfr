import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AnimatedBackground } from './AnimatedBackground';

describe('AnimatedBackground Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<AnimatedBackground />);
    expect(container.firstChild).toHaveClass('fixed inset-0');
  });

  it('contains motion divs for animated blobs', () => {
    const { container } = render(<AnimatedBackground />);
    // Since motion.div is mocked to 'div' in setup.ts
    const blobs = container.querySelectorAll('.rounded-full.mix-blend-screen');
    expect(blobs.length).toBe(3);
  });
});
