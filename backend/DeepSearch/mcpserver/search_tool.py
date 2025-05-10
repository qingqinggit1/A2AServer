#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Date  : 2025/4/29 (Modified: 2025-04-22)
# @File  : search_tool.py
# @Author: johnson
# @Contact : github: johnson7788
# @Desc  : eg: 搜索工具
import time

from fastmcp import FastMCP
from typing import List, Dict, Optional, Union
from datetime import datetime, timedelta, date
import httpx
import requests
from zhipuai import ZhipuAI
import json

mcp = FastMCP("搜索工具")
# @mcp.tool()
@mcp.tool()
def search_internet(query: str) -> str:
    """
    利用搜索引擎搜索网络内容
    :param query: 搜索的词语和句子
    :return:
    """
    message = [
        {"role": "user", "content": "你是一个搜索引擎，模拟生成一些搜索结果"},
        {"role": "user", "content": query}
    ]
    client = ZhipuAI(api_key="")
    response = client.chat.completions.create(
        model="glm-4-flash",
        messages=message,
        temperature=0.9,
    )
    res = response.choices[0].message
    return res.content

if __name__ == '__main__':
    result = search_internet(query="小米新闻")
    print(result)