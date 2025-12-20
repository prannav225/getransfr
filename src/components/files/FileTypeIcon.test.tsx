import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FileTypeIcon } from './FileTypeIcon';

describe('FileTypeIcon Component', () => {
  it('renders FileImage for image mime types', () => {
    const { container } = render(<FileTypeIcon mimeType="image/png" />);
    expect(container.querySelector('.lucide-file-image')).toBeInTheDocument();
  });

  it('renders FileVideo for video mime types', () => {
    const { container } = render(<FileTypeIcon mimeType="video/mp4" />);
    expect(container.querySelector('.lucide-file-video')).toBeInTheDocument();
  });

  it('renders FileMusic for audio mime types', () => {
    const { container } = render(<FileTypeIcon mimeType="audio/mpeg" />);
    expect(container.querySelector('.lucide-file-music')).toBeInTheDocument();
  });

  it('renders FileText for text mime types', () => {
    const { container } = render(<FileTypeIcon mimeType="text/plain" />);
    expect(container.querySelector('.lucide-file-text')).toBeInTheDocument();
  });

  it('renders FileArchive for archive mime types', () => {
    const { container } = render(<FileTypeIcon mimeType="application/zip" />);
    expect(container.querySelector('.lucide-file-archive')).toBeInTheDocument();
  });

  it('renders default File icon for unknown mime types', () => {
    const { container } = render(<FileTypeIcon mimeType="application/octet-stream" />);
    expect(container.querySelector('.lucide-file')).toBeInTheDocument();
  });
});
