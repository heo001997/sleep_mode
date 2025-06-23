import React from 'react';
import { DashboardPageLayout } from '../components/layout';
import { 
  ChartBarIcon, 
  ClockIcon, 
  MoonIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/outline';

const DashboardPage: React.FC = () => {
  // Placeholder stats data
  const stats = [
    {
      name: 'Average Sleep',
      value: '7.5 hours',
      change: '+0.3h',
      changeType: 'positive',
      icon: ClockIcon,
    },
    {
      name: 'Sleep Quality',
      value: '85%',
      change: '+2%',
      changeType: 'positive',
      icon: MoonIcon,
    },
    {
      name: 'Sessions This Week',
      value: '6',
      change: '+1',
      changeType: 'positive',
      icon: ChartBarIcon,
    },
    {
      name: 'Days Tracked',
      value: '28',
      change: '+28',
      changeType: 'positive',
      icon: UserGroupIcon,
    },
  ];

  return (
    <DashboardPageLayout
      title="Dashboard"
      subtitle="Welcome back! Here's your sleep tracking overview."
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      stat.changeType === 'positive' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stat.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sleep Sessions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Recent Sleep Sessions
            </h3>
            <div className="text-center py-12">
              <MoonIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No sleep sessions yet
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Start tracking your sleep to see data here.
              </p>
            </div>
          </div>
        </div>

        {/* Sleep Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Sleep Trends
            </h3>
            <div className="text-center py-12">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Analytics coming soon
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Sleep pattern analysis will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardPageLayout>
  );
};

export default DashboardPage; 