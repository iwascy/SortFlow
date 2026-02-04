import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileGrid } from './FileGrid';
import { useAppStore } from '../../store/useAppStore';

vi.mock('../../store/useAppStore');

describe('FileGrid', () => {
    const mockFiles = [
        { id: '1', name: 'f1', path: '/root', type: 'file', size: '1MB' },
        { id: '2', name: 'f2', path: '/other', type: 'file', size: '2MB' },
        { id: '3', name: 'f3', path: '/root', type: 'file', size: '3MB' },
    ];

    const toggleSelection = vi.fn();

    beforeEach(() => {
        (useAppStore as any).mockReturnValue({
            files: mockFiles,
            currentPath: '/root',
            selectedIds: new Set(['1']),
            toggleSelection,
        });
    });

    it('renders only files in current path', () => {
        render(<FileGrid />);
        expect(screen.getByText('f1')).toBeInTheDocument();
        expect(screen.getByText('f3')).toBeInTheDocument();
        expect(screen.queryByText('f2')).not.toBeInTheDocument();
    });

    it('handles clicks', () => {
        render(<FileGrid />);
        // Click f3 text, bubble up to card
        fireEvent.click(screen.getByText('f3'));
        expect(toggleSelection).toHaveBeenCalledWith('3', false, false);
    });
});
