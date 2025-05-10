// src/components/AgentSelector.js
import React, { useState } from 'react';

const PRESET_AGENTS = [
  { name: "LNG Agent", url: "http://localhost:10003" },
  { name: "Deep Search", url: "http://localhost:10004" },
  // Add more preset agents here
  // { name: "Remote Agent (Example)", url: "http://10.228.32.77:10009" },
];

// 定义一个AgentSelector组件，用于选择代理
function AgentSelector({ onAgentSelect, isLoading }) {
  // 定义一个状态变量，用于存储自定义URL
  const [customUrl, setCustomUrl] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');

  const handleSelectPreset = (e) => {
    const url = e.target.value;
    setSelectedPreset(url);
    setCustomUrl(url); // Also update customUrl input for clarity or direct submission
    if (url) {
      onAgentSelect(url);
    }
  };

  const handleCustomUrlChange = (e) => {
    setCustomUrl(e.target.value);
    setSelectedPreset(''); // Clear preset selection if typing custom URL
  };

  const handleSubmitUrl = (e) => {
    e.preventDefault();
    if (customUrl) {
      onAgentSelect(customUrl);
    }
  };

  return (
    <div className="mb-6 p-4 border rounded-lg shadow-md bg-white">
      <h2 className="text-xl font-semibold mb-3 text-gray-700">Select Agent</h2>
      <div className="mb-3">
        <label htmlFor="presetAgent" className="block text-sm font-medium text-gray-600 mb-1">
          Preset Agents:
        </label>
        <select
          id="presetAgent"
          value={selectedPreset}
          onChange={handleSelectPreset}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          disabled={isLoading}
        >
          <option value="">-- Select a preset --</option>
          {PRESET_AGENTS.map(agent => (
            <option key={agent.url} value={agent.url}>{agent.name}</option>
          ))}
        </select>
      </div>
      <form onSubmit={handleSubmitUrl} className="space-y-3">
        <div>
          <label htmlFor="customAgentUrl" className="block text-sm font-medium text-gray-600 mb-1">
            Or Enter Agent URL:
          </label>
          <input
            type="text"
            id="customAgentUrl"
            value={customUrl}
            onChange={handleCustomUrlChange}
            placeholder="e.g., http://localhost:10003"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={isLoading || !customUrl}
        >
          {isLoading ? 'Loading Card...' : 'Load Agent Card'}
        </button>
      </form>
    </div>
  );
}

export default AgentSelector;