import requests
from common.A2Atypes import AgentCard

def get_agent_card(remote_agent_address: str) -> AgentCard:
  """Get the agent card."""
  print(f"开始获取{remote_agent_address}的agent card")
  agent_card = requests.get(
      f"http://{remote_agent_address}/.well-known/agent.json"
  )
  return AgentCard(**agent_card.json())
