import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileCard } from './FileCard';
import type { FileItem } from '../../types';

describe('FileCard', () => {
    const mockFile: FileItem = {
        id: '1',
        name: 'test.png',
        path: '/root',
        type: 'file',
        size: '1.2MB',
        ctime: 0,
        mtime: 0,
        thumbnail: '/thumb.png'
    };

    it('renders file info', () => {
        render(<FileCard file={mockFile} />);
        expect(screen.getByText('test.png')).toBeInTheDocument();
        expect(screen.getByText('1.2MB')).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute('src', '/thumb.png');
    });

    it('calls onClick handler', () => {
        const handleClick = vi.fn();
        render(<FileCard file={mockFile} onClick={handleClick} />);

        // Click on the card container
        fireEvent.click(screen.getByText('test.png').closest('div')!.parentElement!);
        expect(handleClick).toHaveBeenCalled();
    });

    it('shows selected state', () => {
        render(<FileCard file={mockFile} selected={true} />);
        expect(screen.getByText('check')).toBeInTheDocument();
    });
});
