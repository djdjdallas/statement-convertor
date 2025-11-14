/**
 * API Key Manager Component
 *
 * Displays and manages user's API keys
 * - List all keys
 * - Create new keys
 * - Revoke existing keys
 * - Show key details (last used, status, etc.)
 */

'use client';

import { useState, useEffect } from 'react';
import { Key, Trash2, Copy, Plus, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function APIKeyManager({ userId }) {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState(null);
  const [keyName, setKeyName] = useState('');
  const [environment, setEnvironment] = useState('live');

  useEffect(() => {
    fetchKeys();
  }, [userId]);

  async function fetchKeys() {
    try {
      const response = await fetch('/api/v1/keys');
      const data = await response.json();

      if (data.success) {
        setKeys(data.keys);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createKey() {
    if (!keyName.trim()) {
      alert('Please enter a key name');
      return;
    }

    try {
      const response = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: keyName,
          environment
        })
      });

      const data = await response.json();

      if (data.success) {
        setNewKeyData(data);
        setShowNewKeyModal(true);
        setKeyName('');
        fetchKeys(); // Refresh list
      } else {
        alert(data.message || 'Failed to create API key');
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Failed to create API key');
    }
  }

  async function revokeKey(keyId) {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/keys/${keyId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        fetchKeys(); // Refresh list
      } else {
        alert(data.message || 'Failed to revoke API key');
      }
    } catch (error) {
      console.error('Error revoking API key:', error);
      alert('Failed to revoke API key');
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Key className="h-6 w-6 mr-2 text-indigo-600" />
              API Keys
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage your API keys for authenticating requests
            </p>
          </div>
          <button
            onClick={() => setShowNewKeyModal(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Key
          </button>
        </div>
      </div>

      {/* Keys List */}
      <div className="p-6">
        {keys.length === 0 ? (
          <div className="text-center py-12">
            <Key className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No API keys yet</h3>
            <p className="text-gray-600 mb-6">Create your first API key to get started</p>
            <button
              onClick={() => setShowNewKeyModal(true)}
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create API Key
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {keys.map((key) => (
              <div
                key={key.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-semibold text-gray-900">{key.name}</h3>
                      <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
                        key.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : key.status === 'revoked'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {key.status}
                      </span>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${
                        key.environment === 'live'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {key.environment}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                      <code className="px-2 py-1 bg-gray-100 rounded font-mono">{key.key}</code>
                      <button
                        onClick={() => copyToClipboard(key.key)}
                        className="text-indigo-600 hover:text-indigo-700 flex items-center"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <p className="font-medium">{new Date(key.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Used:</span>
                        <p className="font-medium">
                          {key.last_used_at
                            ? new Date(key.last_used_at).toLocaleDateString()
                            : 'Never'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Requests:</span>
                        <p className="font-medium">{key.total_requests || 0}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => revokeKey(key.id)}
                    disabled={key.status !== 'active'}
                    className={`ml-4 p-2 rounded transition-colors ${
                      key.status === 'active'
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                    title="Revoke key"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Key Modal */}
      {showNewKeyModal && !newKeyData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold mb-4">Create New API Key</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g., Production Server"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Environment
                </label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="live">Live</option>
                  <option value="test">Test</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={createKey}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Create Key
              </button>
              <button
                onClick={() => {
                  setShowNewKeyModal(false);
                  setKeyName('');
                }}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Key Display Modal */}
      {newKeyData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-8 w-8 text-yellow-600 mr-3" />
              <h3 className="text-2xl font-bold text-gray-900">Save Your API Key</h3>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 font-medium">
                ⚠️ This is the only time you'll see this key. Copy it now and store it securely.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your API Key
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 px-4 py-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
                  {newKeyData.api_key}
                </code>
                <button
                  onClick={() => copyToClipboard(newKeyData.api_key)}
                  className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <Copy className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">Key Information</h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Name:</dt>
                  <dd className="font-medium">{newKeyData.key_info.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Environment:</dt>
                  <dd className="font-medium">{newKeyData.key_info.environment}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Created:</dt>
                  <dd className="font-medium">
                    {new Date(newKeyData.key_info.created_at).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>

            <button
              onClick={() => {
                setNewKeyData(null);
                setShowNewKeyModal(false);
              }}
              className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              I've Saved My Key
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
