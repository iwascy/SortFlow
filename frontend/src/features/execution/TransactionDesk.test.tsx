import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionDesk } from './TransactionDesk';
import { useAppStore } from '../../store/useAppStore';

vi.mock('../../store/useAppStore');

describe('TransactionDesk', () => {
    const updateMixerConfig = vi.fn();
    const setPreviewOps = vi.fn();
    const mockFiles = [{ id: '1', name: 'f1.jpg', path: '/root', sourcePath: '/root/f1.jpg', type: 'JPG', size: '1MB', ctime: 0, mtime: 0 }];
    const mockPresets = [
        { id: 'scenery', name: 'Scenery', icon: 'landscape', color: 'indigo', targetSubPath: 'Travel/Scenery', defaultPrefix: 'TR_' },
        { id: 'vacation', name: 'Vacation', icon: 'beach_access', color: 'primary', targetSubPath: 'Vacation', defaultPrefix: 'VAC_' },
    ];
    const mockTargets = [
        { id: 'nas-photos', name: 'NAS Photos', path: '/mnt/nas/photos/2024', icon: 'dns' },
    ];

    beforeEach(() => {
        (useAppStore as any).mockReturnValue({
            selectedIds: new Set(['1']),
            files: mockFiles,
            mixerConfig: {
                presetId: 'scenery',
                targetRootId: 'nas-photos',
                usePrefix: true,
                useDate: false,
                useOriginal: false,
                selectedTokens: [],
                selectedKeywords: [],
                selectedOrder: [],
            },
            updateMixerConfig,
            isPreviewLoading: false,
            presets: mockPresets,
            targetRoots: mockTargets,
            setPreviewOps,
        });
    });

    it('renders selection count', () => {
        render(<TransactionDesk onExecute={() => {}} />);
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText(/Queued/i)).toBeInTheDocument();
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

        fireEvent.click(screen.getByText(/Execute Task/i));
        expect(handleExecute).toHaveBeenCalled();
    });
});
