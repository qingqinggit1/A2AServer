import React, { useState, useCallback } from 'react';
import AgentSelector from './components/AgentSelector';
import AgentCardDisplay from './components/AgentCardDisplay';
import ChatInterface from './components/ChatInterface';
import { getAgentCard } from './services/a2aApiService';

function App() {
  const [agentUrl, setAgentUrl] = useState('');
  const [agentCard, setAgentCard] = useState(null);
  const [isLoadingCard, setIsLoadingCard] = useState(false);
  const [errorCard, setErrorCard] = useState(null);

  const handleAgentSelect = useCallback(async (url) => {
    if (!url) {
      setAgentCard(null);
      setErrorCard(null);
      setAgentUrl('');
      return;
    }
    setAgentUrl(url);
    setIsLoadingCard(true);
    setErrorCard(null);
    setAgentCard(null); // Clear previous card
    try {
      const card = await getAgentCard(url);
      setAgentCard(card);
    } catch (err) {
      setErrorCard(`Failed to load agent card: ${err.message}`);
      setAgentCard(null);
    } finally {
      setIsLoadingCard(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-indigo-700">A2A Single Agent Client</h1>
      </header>

      <div className="max-w-4xl mx-auto space-y-6">
        <AgentSelector onAgentSelect={handleAgentSelect} isLoading={isLoadingCard} />

        {isLoadingCard && (
          <div className="text-center p-4 text-indigo-600">
            <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>Loading Agent Information...</p>
          </div>
        )}
        {errorCard && <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg shadow" role="alert">{errorCard}</div>}

        {agentCard && !errorCard && (
          <>
            <AgentCardDisplay agentCard={agentCard} />
            <ChatInterface agentCard={agentCard} />
          </>
        )}

        {!agentCard && !isLoadingCard && !errorCard && (
           <div className="text-center p-10 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
             <p className="text-xl">Please select or enter an Agent URL to begin.</p>
           </div>
        )}
      </div>
       <footer className="text-center mt-12 py-4 text-sm text-gray-500">
        A2A Client Demo -- Single Agent
      </footer>
    </div>
  );
}

export default App;