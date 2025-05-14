#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Date  : 2025/4/24 13:20
# @File  : basic_RAG_keyword.py
# @Author: johnson
# @Contact : github: johnson7788
# @Desc  : 用于知识库检索

import requests
from fastmcp import FastMCP
# from api_utils import ApiClient
from milvus_utils.milvus_client import MilvusClient_Base

# 创建 FastMCP 服务
mcp = FastMCP("知识库的检索")
# 初始化milvus，并创建数据库和表
milvus_client = MilvusClient_Base()
def vector(text):
    #将文本向量化
    url = "http://192.168.1.22:7070/vectors"
    payload = {
        "text": text
    }
    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()

        # 获取 "vector" 对应的值
        vector = data.get("vector")  # 安全方式，若不存在则返回 None
        print("向量长度：", len(vector))
        return vector

    except requests.RequestException as e:
        print("请求失败：", e)

@mcp.tool()
def RAG_by_semantic(query: str) -> str:
    """
    根据用户问题检索知识库
    :param: query: 用户的问题
    :return:
    """
    print("basic_RAG: 开始检索知识库...")
    top_k = 5  # topk个文档内容
    vectors = vector(query)
    results = milvus_client.search_data(vectors)
    results_new = results[:top_k]
    # print(results_new)
    # 拼接所有 segment 字段内容
    combined_text = '\n'.join(item["entity"]["answer"] for item in results_new)
    # print(combined_text)
    return combined_text


if __name__ == '__main__':
    result = RAG_by_semantic("郑嘉怡的部门？")
    # print(f"检索到的结果是:\n{result}")
    print("🔍 检索到的结果是：\n")
    print(result)
    # for idx, item in enumerate(result):
    #     print(f"--- 结果 {idx + 1} ---")
    #     for key, value in item.items():
    #         print(f"{key}: {value}")
    #     print()  # 空行分隔每条结果
