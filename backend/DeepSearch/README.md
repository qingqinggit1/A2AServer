#  深度搜索的示例

## 1. 安装依赖
cd backend/A2AServer
pip install -e .

## 2. 配置环境变量
cp env_template.txt .env

## 3. 修改prompt.txt

## 4. 修改mcp_config.json

### 4.1 自定义mcp server
创建mcpserver目录，并在里面添加mcp server的文件

## 5. 启动服务
python main.py


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
