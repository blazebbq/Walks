'use client';

import { useState } from 'react';
import BlueprintViewer, { Issue } from '@/components/BlueprintViewer';

export default function BlueprintDemo() {
  // Sample existing issues for demonstration
  const [issues, setIssues] = useState<Issue[]>([
    {
      id: '1',
      pinX: 0.3,
      pinY: 0.4,
      title: 'Water leak detected',
      priority: 'Critical',
      type: 'Plumbing',
    },
    {
      id: '2',
      pinX: 0.7,
      pinY: 0.3,
      title: 'HVAC maintenance required',
      priority: 'High',
      type: 'HVAC',
    },
    {
      id: '3',
      pinX: 0.5,
      pinY: 0.6,
      title: 'Paint touchup needed',
      priority: 'Low',
      type: 'Cosmetic',
    },
    {
      id: '4',
      pinX: 0.8,
      pinY: 0.7,
      title: 'Light fixture replacement',
      priority: 'Medium',
      type: 'Electrical',
    },
  ]);

  const handlePinAdd = (x: number, y: number) => {
    const newIssue: Issue = {
      id: `new-${Date.now()}`,
      pinX: x,
      pinY: y,
      title: 'New Issue',
      priority: 'Medium',
      type: 'General',
    };
    setIssues([...issues, newIssue]);
    console.log('New pin added at:', { x, y });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Blueprint Viewer Demo</h1>
          <p className="text-gray-600">
            Zoom with scroll wheel or pinch, pan by dragging, tap to add issue pins
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Interactive Mode */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Interactive Mode</h2>
            <p className="text-sm text-gray-600">Tap anywhere on the blueprint to add a new pin</p>
            <div className="h-[500px] border-2 border-gray-200 rounded-lg overflow-hidden">
              <BlueprintViewer
                blueprintUrl="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80"
                existingIssues={issues}
                onPinAdd={handlePinAdd}
                readOnly={false}
              />
            </div>
          </div>

          {/* Read-Only Mode */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Read-Only Mode</h2>
            <p className="text-sm text-gray-600">View existing issues without adding new pins</p>
            <div className="h-[500px] border-2 border-gray-200 rounded-lg overflow-hidden">
              <BlueprintViewer
                blueprintUrl="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80"
                existingIssues={issues}
                readOnly={true}
              />
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Priority Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-red-600"></div>
              <span className="text-sm font-medium">Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-500 rounded-full border-2 border-orange-600"></div>
              <span className="text-sm font-medium">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-500 rounded-full border-2 border-yellow-600"></div>
              <span className="text-sm font-medium">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-green-600"></div>
              <span className="text-sm font-medium">Low</span>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Features</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                <strong>Zoom:</strong> Use scroll wheel (desktop) or pinch (mobile) to zoom in/out
              </span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                <strong>Pan:</strong> Click and drag to move around the blueprint
              </span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                <strong>Tap-to-pin:</strong> Click/tap anywhere to add a new issue marker (interactive mode)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                <strong>Tooltips:</strong> Hover over pins to see issue details
              </span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                <strong>Normalized coordinates:</strong> Pin positions work consistently across all screen sizes (0..1)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                <strong>Priority colors:</strong> Visual indicators for issue severity (Critical=red, High=orange, Medium=yellow, Low=green)
              </span>
            </li>
          </ul>
        </div>

        {/* Added Issues */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">All Issues ({issues.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {issues.map((issue) => (
              <div key={issue.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{issue.title}</h4>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium text-white ${
                      issue.priority === 'Critical'
                        ? 'bg-red-500'
                        : issue.priority === 'High'
                        ? 'bg-orange-500'
                        : issue.priority === 'Medium'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                  >
                    {issue.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{issue.type}</p>
                <p className="text-xs text-gray-500">
                  Position: ({issue.pinX.toFixed(3)}, {issue.pinY.toFixed(3)})
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
