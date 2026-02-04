import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionDesk } from './TransactionDesk';
import { useAppStore } from '../../store/useAppStore';

vi.mock('../../store/useAppStore');

describe('TransactionDesk', () => {
    const updateMixerConfig = vi.fn();
    const mockFiles = [{ id: '1', name: 'f1.jpg', path: '/root', type: 'JPG' }];

    beforeEach(() => {
        (useAppStore as any).mockReturnValue({
            selectedIds: new Set(['1']),
            files: mockFiles,
            mixerConfig: {
                presetId: 'scenery',
                targetRootId: 'nas-photos',
                usePrefix: true,
            },
            updateMixerConfig,
            isPreviewLoading: false,
        });
    });

    it('renders selection count', () => {
        render(<TransactionDesk onExecute={() => {}} />);
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText(/Items Queued/i)).toBeInTheDocument();
    });

    it('renders presets', () => {
        render(<TransactionDesk onExecute={() => {}} />);
        expect(screen.getByText('Scenery')).toBeInTheDocument();
        expect(screen.getByText('Vacation')).toBeInTheDocument();
    });

    it('calls updateMixerConfig when preset clicked', () => {
        render(<TransactionDesk onExecute={() => {}} />);
        fireEvent.click(screen.getByText('Vacation'));
        expect(updateMixerConfig).toHaveBeenCalledWith({ presetId: 'vacation' });
    });

    it('calls onExecute when commit button clicked', () => {
        const handleExecute = vi.fn();
        render(<TransactionDesk onExecute={handleExecute} />);

        fireEvent.click(screen.getByText(/COMMIT TO ARCHIVE/i));
        expect(handleExecute).toHaveBeenCalled();
    });
});
