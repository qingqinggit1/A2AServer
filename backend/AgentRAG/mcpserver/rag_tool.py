#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Date  : 2025/4/29 (Modified: 2025-04-22)
# @File  : rag_tool.py
# @Author: johnson
# @Contact : github: johnson7788
# @Desc  : eg: RAG检索工具
import time
from fastmcp import FastMCP
import random

mcp = FastMCP("RAG检索工具")

@mcp.tool()
def rag_search(query: str) -> str:
    """
    根据关键词对企业知识库进行搜索
    :param query: 搜索的词语和句子
    :return:
    """
    # 模拟搜索结果
    rag_result = """LNG 是 液化天然气 (Liquefied Natural Gas) 的英文缩写。简单来说，它就是经过冷却至零下约 162 摄氏度 (-260 华氏度) 的液态天然气。

你可以把它想象成把气体“浓缩”成液体，这样做有几个重要的好处：

体积大大缩小： 液化后的天然气体积只有气态时的约 1/600，这使得储存和运输更加高效和经济。
便于长距离运输： 由于体积小，LNG 可以通过专门的 LNG 运输船跨洋运输到没有天然气管道连接的地方。
更纯净： 在液化过程中，天然气中的杂质，如二氧化碳、硫化物和水等会被去除，使得 LNG 燃烧时更加清洁，减少污染物排放。"""
    return rag_result

if __name__ == '__main__':
    result = rag_search(query="LNG")
    print(result)