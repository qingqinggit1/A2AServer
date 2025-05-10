# 目录
```angular2html
backend
├── A2AServer  # 依赖包
├── DeepSearch # 测试示例，进行深度搜索
└── client.py  # 测试A2A的客户端
```

# 如何开发自己的A2A Server
1. 参考DeepSearch的示例，复制整个DeepSearch目录为自己的项目
```angular2html
DeepSearch
├── .env   # 放模型的Key文件
├── main.py  #你的A2A Server的启动文件
├── mcp_config.json  # 你的MCP Server的配置文件
├── mcpserver   # 你的MCP Server的代码, 可以没有
     └── search_tool.py  # 某个MCP工具，可以有多个工具，
└── prompt.txt  #Agent的Prompt文件
```


# 注意
mcp_config.json中的工具的名称需要使用没有下划线的分隔符，否则不能找到工具，建议SearchTool或者RAGTool等，不要使用Search_Tool或者RAG_Tool等