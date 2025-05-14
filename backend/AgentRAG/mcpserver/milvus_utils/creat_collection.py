import time
import logging
from pymilvus import (
    connections, FieldSchema, CollectionSchema, DataType, Collection
)


# 连接 Milvus
connections.connect(alias="default", host="192.168.1.209", port="19530")

# 定义字段
fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True, description="自动生成主键"),
    FieldSchema(name="doc_id", dtype=DataType.VARCHAR, max_length=256, description="文章id，可能重复"),
    FieldSchema(name="title", dtype=DataType.VARCHAR, max_length=1024, description="文章标题"),
    FieldSchema(name="text_vector", dtype=DataType.FLOAT_VECTOR, dim=1024, description="句子向量"),
    FieldSchema(name="answer", dtype=DataType.VARCHAR, max_length=10248, description="上下文答案"),
    FieldSchema(name="segment", dtype=DataType.VARCHAR, max_length=10248, description="原始句子"),
]

# 定义集合 Schema
schema = CollectionSchema(fields=fields, enable_dynamic_field=True)

# 创建集合
collection = Collection(name="rag_mcp", schema=schema)

# 创建向量索引
index_params = {
    "index_type": "IVF_FLAT",
    "params": {"nlist": 1024},
    "metric_type": "COSINE"
}
collection.create_index(field_name="text_vector", index_params=index_params)

# 加载集合到内存
collection.load()
time.sleep(2)
logging.info("集合：rag_mcp已经创建.")
