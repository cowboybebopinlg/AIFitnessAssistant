import React from 'react';

const LoadingIndicator: React.FC = () => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary-500 border-t-transparent"></div>
        </div>
    );
};

export default LoadingIndicator;