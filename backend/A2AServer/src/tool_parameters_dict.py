#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Date  : 2025/4/25 16:22
# @File  : tool_parameters_dict.py
# @Author: johnson
# @Contact : github: johnson7788
# @Desc  : 用于配置工具调用时的匹配

# 注意，这里的工具名称一定是你的mcp_config.json里面配置的mcp的server的名称和函数的名称的拼接，使用_进行拼接
MATCH_TOOL_PARAMETERS = {
    "knowledgeRetrieval_query_RAG_by_keyword": {
        "knowledge_base_id": "list",
        "file_id": "list"
    }
}
