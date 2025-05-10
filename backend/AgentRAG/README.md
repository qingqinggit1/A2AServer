#  测试使用Agent进行调用MCP进行RAG的示例

## 1. 安装依赖
cd backend/A2AServer
pip install -e .

## 2. 配置环境变量
cp env_template.txt .env

## 3. 修改prompt.txt

## 4. MCP server的配置

### 4.1 自定义mcp server
创建mcpserver目录，并在里面添加mcp server的文件
search_tool.py

### 4.2 启动mcp server
cd mcpserver
fastmcp run --transport sse --port 7001 search_tool.py

### 4.2 修改mcp_config.json, 搭配server-sequential-thinking进行深度搜索效果更好
```json
{
  "mcpServers": {
    "SearchTool": {
      "url": "http://127.0.0.1:7001/sse"
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

## 5. 启动A2A的server端服务
python main.py

## 6. 测试
使用client.py进行测试A2A的server端
python client.py --agent http://localhost:10004

# 帮助命令
python main.py --help
Usage: main.py [OPTIONS]

  启动 A2A Server，用于加载智能 Agent 并响应任务请求

Options:
  --host TEXT        服务器绑定的主机名（默认为 localhost）
  --port INTEGER     服务器监听的端口号（默认为 10004）
  --prompt TEXT      Agent 的 prompt 文件路径（默认为 prompt.txt）
  --model TEXT       使用的模型名称（如 deepseek-chat）
  --provider TEXT    模型提供方名称（如 deepseek、openai 等）
  --mcp_config TEXT  MCP 配置文件路径（默认为 mcp_config.json）
  --help             Show this message and exit.


## 使用Stdio模式代替SSE模式启动MCP server， 推荐搭配server-sequential-thinking进行深度搜索
```json
{
  "mcpServers": {
    "SearchTool": {
      "command": "uv",
      "args": [
        "run",
        "--with",
        "fastmcp",
        "fastmcp",
        "run",
        "mcpserver/search_tool.py"
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

可以先尝试下使用下面命令，查看uv的启动的mcp服务依赖包是否正常
uv run --with fastmcp fastmcp run mcpserver/search_tool.py