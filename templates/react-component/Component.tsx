import React from 'react';
import clsx from 'clsx';

interface { { ComponentName } }Props {
    className ?: string;
    children ?: React.ReactNode;
    // Add custom props
}

export const {{ ComponentName }}: React.FC < {{ ComponentName }}Props > = ({
    className,
    children,
    ...props
}) => {
    return (
        <div 
      className= {
        clsx(
        'base-styles', // Add base styles here
            className
        )
    }
    {...props }
    >
        { children }
        </div>
  );
};
