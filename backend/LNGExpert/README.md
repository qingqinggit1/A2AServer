# Complex Question Answering Examples(flexible workflow)

This repository provides examples of tools using the Model Context Protocol (MCP), enabling agents to complete tasks following specific workflows. Workflow examples are provided in the prompts; if not, agents will flexibly solve problems through reasoning.

---

## 🚀 Getting Started

### 1. Install Dependencies
Navigate to the backend directory and install the required packages:
```bash
cd backend/A2AServer
pip install -e .
```

### 2. Configure Environment Variables
Copy the environment template and customize it as needed:
```bash
cp env_template.txt .env
```

### 3. Update Prompt File
Modify the `prompt.txt` file to define the behavior of your agent.

---

## ⚙️ MCP Server Configuration

### 4.1 Set Up Custom MCP Server
1. Create an `mcpserver` directory.
2. Add your MCP server files (e.g., `xxx.py`) to the `mcpserver` directory.
3. Configure multiple MCP files in `mcp_config.json` as needed.

### 4.2 Configure `mcp_config.json`
Update mcp_config.json to include your multiple MCP servers. Use server-sequential-thinking for sequential reasoning:
```json
{
  "mcpServers": {
    "FactoryProfit": {
      "command": "uv",
      "args": [
        "run",
        "--with",
        "fastmcp",
        "fastmcp",
        "run",
        "mcpserver/Simulate_Factory_Profit.py"
      ]
    },
    "LNGPrice": {
      "command": "uv",
      "args": [
        "run",
        "--with",
        "fastmcp",
        "fastmcp",
        "run",
        "mcpserver/Simulate_LNG_Price.py"
      ]
    },
    "sequentialThinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    }
  }
}

```

---

## 🌐 Start A2A Server
Launch the A2A server to handle agent tasks:
```bash
python main.py --port 10003
```

---

## 🧪 Testing
Test the A2A server using the provided client script:
```bash
python client.py --agent http://localhost:10003
```

---


### Verify MCP Dependencies
Before starting, check if the required dependencies are correctly installed:
```bash
uv run --with fastmcp fastmcp run mcpserver/Simulate_Factory_Profit.py
uv run --with fastmcp fastmcp run mcpserver/Simulate_LNG_Price.py
```

---

## 📖 Command-Line Help
View available options for the A2A server:
```bash
python main.py --help
```

**Output:**
```
Usage: main.py [OPTIONS]

  Start A2A Server to load intelligent agents and respond to task requests.

Options:
  --host TEXT        Hostname to bind the server (default: localhost)
  --port INTEGER     Port to listen on (default: 10004)
  --prompt TEXT      Path to the agent's prompt file (default: prompt.txt)
  --model TEXT       Model name (e.g., deepseek-chat)
  --provider TEXT    Model provider (e.g., deepseek, openai)
  --mcp_config TEXT  Path to MCP configuration file (default: mcp_config.json)
  --help             Show this message and exit.
```

---

## 💡 Tips
- Pairing with `server-sequential-thinking` enhances DeepSearch capabilities.
- Ensure all paths in configuration files are correct to avoid runtime errors.
- Test the MCP server independently before integrating with the A2A server.