#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Date  : 2025/4/29 (Modified: 2025-04-22)
# @File  : search_tool.py
# @Author: johnson
# @Contact : github: johnson7788
# @Desc  : eg: 搜索工具
import time

from fastmcp import FastMCP
import random

mcp = FastMCP("搜索工具")

# @mcp.tool()
# def search_internet(query: str) -> str:
#     """
#     利用搜索引擎搜索网络内容
#     :param query: 搜索的词语和句子
#     :return:
#     """
#     from zhipuai import ZhipuAI
#     message = [
#         {"role": "user", "content": "你是一个搜索引擎，模拟生成一些搜索结果"},
#         {"role": "user", "content": query}
#     ]
#     client = ZhipuAI(api_key="")
#     response = client.chat.completions.create(
#         model="glm-4-flash",
#         messages=message,
#         temperature=0.9,
#     )
#     res = response.choices[0].message
#     return res.content

@mcp.tool()
def search_internet(query: str) -> str:
    """
    利用搜索引擎搜索网络内容
    :param query: 搜索的词语和句子
    :return:
    """
    # 模拟的小米汽车相关新闻列表
    xiaomi_car_news = [
        "小米汽车SU7正式发布，售价21.59万元起，首批订单火爆。",
        "雷军称小米汽车三年投入100亿美元，目标成为智能电动车前三。",
        "小米SU7试驾反响热烈，用户称智能座舱体验媲美特斯拉。",
        "小米汽车工厂实现高度自动化，一辆SU7平均3分钟下线一台。",
        "小米发布智能驾驶系统Xiaomi Pilot，计划2025年实现全自动驾驶。",
    ]
    return random.choice(xiaomi_car_news)

if __name__ == '__main__':
    result = search_internet(query="小米新闻")
    print(result)