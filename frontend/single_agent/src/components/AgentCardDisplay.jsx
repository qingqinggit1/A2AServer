import React from 'react';

function AgentCardDisplay({ agentCard }) {
  if (!agentCard) {
    return null;
  }

  return (
    <div className="mb-6 p-4 border rounded-lg shadow-md bg-white">
      <h2 className="text-xl font-semibold mb-3 text-indigo-700">{agentCard.name} - Agent Details</h2>
      <div className="space-y-2 text-sm text-gray-600">
        <p><strong>Description:</strong> {agentCard.description || 'N/A'}</p>
        <p><strong>Version:</strong> {agentCard.version}</p>
        <p><strong>Agent Endpoint URL:</strong> <code className="bg-gray-100 p-1 rounded text-xs">{agentCard.agentEndpointUrl}</code></p>
        <p><strong>Documentation:</strong> {agentCard.documentationUrl ? <a href={agentCard.documentationUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">{agentCard.documentationUrl}</a> : 'N/A'}</p>
        <div>
          <strong>Capabilities:</strong>
          <ul className="list-disc list-inside ml-4">
            <li>Streaming: {agentCard.capabilities.streaming ? 'Yes' : 'No'}</li>
            <li>Push Notifications: {agentCard.capabilities.pushNotifications ? 'Yes' : 'No'}</li>
            <li>State Transition History: {agentCard.capabilities.stateTransitionHistory ? 'Yes' : 'No'}</li>
          </ul>
        </div>
        {agentCard.provider && (
          <p><strong>Provider:</strong> {agentCard.provider.organization} {agentCard.provider.url && <a href={agentCard.provider.url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">(Website)</a>}</p>
        )}
        <p><strong>Default Input Modes:</strong> {agentCard.defaultInputModes.join(', ')}</p>
        <p><strong>Default Output Modes:</strong> {agentCard.defaultOutputModes.join(', ')}</p>
        {/* Skills can be detailed further if needed */}
        {/* <p><strong>Skills:</strong> {agentCard.skills?.map(s => s.name).join(', ') || 'N/A'}</p> */}
      </div>
    </div>
  );
}

export default AgentCardDisplay;