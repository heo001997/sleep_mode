import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <ExclamationTriangleIcon className="h-24 w-24 text-gray-400" />
        </div>
        
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Page not found
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you might have mistyped the URL.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            <HomeIcon className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 