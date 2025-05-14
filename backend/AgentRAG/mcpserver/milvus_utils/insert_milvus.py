

import os
import fitz  # PyMuPDF，用于 PDF
import docx  # python-docx，用于 Word
import openpyxl  # 用于 Excel
import uuid
import requests
import textwrap

from milvus_client import MilvusClient_Base
# from milvus_utils.milvus_client import MilvusClient_Base

def read_txt(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def read_docx(file_path):
    doc = docx.Document(file_path)
    return '\n'.join([para.text for para in doc.paragraphs])

def read_pdf(file_path):
    text = ''
    pdf = fitz.open(file_path)
    for page in pdf:
        text += page.get_text()
    return text

def read_xlsx(file_path):
    #你想在读取 Excel 的每一行时，把每个单元格前加上对应的列名（第一行）作为前缀，组成如：
    #姓名：付金；电话：1834533；单位：北京。
    wb = openpyxl.load_workbook(file_path)
    data_list = []

    for sheet in wb.worksheets:
        rows = list(sheet.iter_rows(values_only=True))
        if not rows:
            continue
        headers = rows[0]  # 第一行作为列名
        for row in rows[1:]:  # 从第二行开始是数据
            line_parts = []
            for header, cell in zip(headers, row):
                if header and cell:
                    line_parts.append(f"{str(header).strip()}：{str(cell).strip()}")
            if line_parts:
                line = '；'.join(line_parts)
                # 如果没有以句号结尾，加上句号
                if not line.endswith(('。', '.', '！', '？')):
                    line += '。'
                data_list.append(line)

    return data_list

def read_file(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.txt':
        return read_txt(file_path)
    elif ext == '.docx':
        return read_docx(file_path)
    elif ext == '.pdf':
        return read_pdf(file_path)
    elif ext == '.xlsx':
        return read_xlsx(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")

# def segment_text(text):
#     # 按回车符进行分段
#     return [seg.strip() for seg in text.splitlines() if seg.strip()]

def segment_text(text):
    #小于 100 字的段落，和下一个段落合并；
    #大于 200 字的段落，按每 100 字拆分；
    #其余的保留原样。
    raw_segments = [seg.strip() for seg in text.splitlines() if seg.strip()]
    result = []
    buffer = ""

    i = 0
    while i < len(raw_segments):
        seg = raw_segments[i]
        length = len(seg)

        if length < 100:
            buffer += seg + " "
            i += 1
            # 如果下一个段落也小，继续合并，直到够长或结束
            while i < len(raw_segments) and len(buffer) < 100:
                buffer += raw_segments[i] + " "
                i += 1
            result.append(buffer.strip())
            buffer = ""
        elif length > 200:
            # 拆分大段落为多个小段
            chunks = textwrap.wrap(seg, width=100)
            result.extend([chunk.strip() for chunk in chunks])
            i += 1
        else:
            result.append(seg)
            i += 1

    return result

def combine_segments(segments, max_chars=1000, max_context=4):
    # 每个segment保留其原始位置作为中心；
    # 上下文最多各扩展4条；
    # 总长度严格不超过1000字（或指定的max_chars）；
    # 保持len(combined_segments) == len(segments)。combined_segments = []
    combined_segments = []
    for i in range(len(segments)):
        current = segments[i]
        combined = current
        total_len = len(current)

        # 向上合并（最多 max_context 条）
        up_count = 0
        up = i - 1
        while up >= 0 and up_count < max_context:
            candidate = segments[up] + '\n' + combined
            if len(candidate) <= max_chars:
                combined = candidate
                total_len = len(combined)
                up_count += 1
                up -= 1
            else:
                break

        # 向下合并（最多 max_context 条）
        down_count = 0
        down = i + 1
        while down < len(segments) and down_count < max_context:
            candidate = combined + '\n' + segments[down]
            if len(candidate) <= max_chars:
                combined = candidate
                total_len = len(combined)
                down_count += 1
                down += 1
            else:
                break

        combined_segments.append(combined.strip())

    return combined_segments



def zuhe(segments,answers,title,doc_id):
    #segments向量化并组合字典格式
    datas = []
    for i in range(len(segments)):
        text_vector = vector(segments[i])
        data = {
            "title": title,
            "answer": answers[i],
            "segment": segments[i],
            "text_vector":text_vector,
            "doc_id":doc_id
        }
        datas.append(data)

    return datas

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


# 示例路径
# file_path = "/Users/admin/Desktop/银景科技/数据/rag测试数据/通讯录DA.xlsx"  # doc_id: ed94e31d-a481-4d16-b4e5-ec67b2b1d21d
# file_path = "/Users/admin/Desktop/银景科技/数据/rag测试数据/人事制度.docx"  # doc_id: 6fd9d71d-b16a-4799-8fd1-e662a1697832
# file_path = "/Users/admin/Desktop/银景科技/数据/rag测试数据/飞机设计手册第12册飞行控制系统和液压系统设计.docx"  # doc_id: 9815bd21-d1b1-4b17-83c3-d6380cd194f5
file_path = "/Users/admin/Desktop/银景科技/数据/rag测试数据/北京市地方性法规、政府规章及其他规范性文件.pdf"  # doc_id: 4596697a-91de-461f-ac05-884a787efb71
# 获取文件名（带扩展名）
title = os.path.basename(file_path)
print("文章标题：", title)
doc_id = str(uuid.uuid4())
print("doc_id:", doc_id)

# raw_text = ""
# 读取文件内容或数据列表
ext = os.path.splitext(file_path)[1].lower()
if ext == '.xlsx':
    # 直接调用专门处理 xlsx 的函数，返回的是列表
    segments = read_xlsx(file_path)
else:
    # 其它类型先读取为纯文本，再按回车分段
    raw_text = read_file(file_path)
    segments = segment_text(raw_text)

# 打印结果
for i, seg in enumerate(segments, 1):
    print(f"段落 {i}: {seg}")
#segments向量化并组合字典格式
answers = combine_segments(segments)
data_lists = zuhe(segments,answers,title,doc_id)
# 初始化milvus，并创建数据库和表
milvus_client = MilvusClient_Base()
# 并创建数据库和表
# milvus_client.create_collection()
#数据插入milvus中
milvus_client.insert_data(data_lists)
print("doc_id:", doc_id)




