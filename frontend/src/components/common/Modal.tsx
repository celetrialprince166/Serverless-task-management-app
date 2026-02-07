import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    children,
    className,
    size = 'md'
}) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-xl',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" >
    <div 
        className="fixed inset-0 bg-gray-900/50 transition-opacity backdrop-blur-sm" 
        onClick = { onClose }
        />

        <div
            className={clsx(
                'relative w-full bg-white rounded-xl shadow-2xl transform transition-all',
                sizeClasses[size],
                className
            )}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
        >
        {/* Close Button implementation if no header is provided in children */ }
    < button 
          onClick = { onClose }
          className = "absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors z-10"
        >
        <X size={ 20} />
    </button>

        { children }
        </div>
        </div>,
    document.body
    );
};
