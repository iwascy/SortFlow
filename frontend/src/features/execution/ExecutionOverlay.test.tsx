import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExecutionOverlay } from './ExecutionOverlay';
import { useAppStore } from '../../store/useAppStore';

vi.mock('../../store/useAppStore');

describe('ExecutionOverlay', () => {
    const setExecutionState = vi.fn();

    beforeEach(() => {
        setExecutionState.mockClear();
    });

    it('renders nothing when IDLE', () => {
        (useAppStore as any).mockReturnValue({
            executionState: { status: 'IDLE' },
            setExecutionState
        });
        const { container } = render(<ExecutionOverlay />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders progress when EXECUTING', () => {
        (useAppStore as any).mockReturnValue({
            executionState: {
                status: 'EXECUTING',
                progress: 50,
                logs: ['Log 1']
            },
            setExecutionState
        });
        render(<ExecutionOverlay />);
        expect(screen.getByText('50%')).toBeInTheDocument();
        expect(screen.getByText('Organizing Data')).toBeInTheDocument();
        expect(screen.getByText(/Log 1/)).toBeInTheDocument();
    });

    it('renders complete state and allows closing', () => {
        (useAppStore as any).mockReturnValue({
            executionState: { status: 'DONE', progress: 100, logs: [] },
            setExecutionState
        });
        render(<ExecutionOverlay />);
        expect(screen.getByText('Archive Sync Complete')).toBeInTheDocument();

        fireEvent.click(screen.getByText('RETURN TO WORKSPACE'));
        expect(setExecutionState).toHaveBeenCalledWith(expect.objectContaining({ status: 'IDLE' }));
    });
});
