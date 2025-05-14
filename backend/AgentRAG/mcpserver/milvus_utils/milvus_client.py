



import logging
import time
import os
import re
from pymilvus import (
    connections,
    CollectionSchema,
    FieldSchema,
    DataType,
    Collection,
    utility,
    db,
    MilvusClient
)


class MilvusClient_Base(object):
    def __init__(self):
        self.host = "192.168.1.209"
        self.port = "19530"
        self.db_name = "default"
        self.collection_name = "rag_mcp"
        #初始化链接，并创建数据库和表
        self.client = self.init_client()

    def init_client(self):
        '''建立Milvus的客户端'''
        url = f"http://{self.host}:{self.port}"
        # 1. Set up a Milvus client
        try:
            client = MilvusClient(uri=url)
            logging.info("Milvus client 初始化成功.")
            return client
        except Exception as e:
            logging.error(f"Failed to initialize Milvus client: {e}")
            raise

    def create_collection(self):
        '''创建集合'''
        # # 创建集合模式
        # 连接到 Milvus 并使用指定的数据库
        connections.connect(alias="default",host=self.host, port=self.port)
        # ["title","doc_id","datasourceid","segment","answer"]
        # 一个中文字符在 UTF-8 编码下占3个字节。
        fields = [
            # FieldSchema(name="title", dtype=DataType.VARCHAR, max_length=512, description="文章标题"),
            FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True, description="自动生成主键"),
            # FieldSchema(name="unique_id", dtype=DataType.VARCHAR, max_length=256,
            #             description="采用时间戳+随机数作为主键"),
            FieldSchema(name="doc_id", dtype=DataType.VARCHAR, max_length=256,
                        description="文章id，不能作为主键，因为有重复的数据存在"),
            FieldSchema(name="title", dtype=DataType.VARCHAR, max_length=1024,
                        description="文章标题"),
            FieldSchema(name="text_vector", dtype=DataType.FLOAT_VECTOR, dim=1024, description="句子向量"),
            FieldSchema(name="answer", dtype=DataType.VARCHAR, max_length=10248, description="句子+前后上下文，传给前端"),
            FieldSchema(name="segment", dtype=DataType.VARCHAR, max_length=10248, description="句子，向量化的句子"),
            # FieldSchema(name="datasourceid", dtype=DataType.INT64, description="数据源id")
        ]
        schema = CollectionSchema(fields=fields, enable_dynamic_field=True)
        # 3.3 创建索引
        # index_params = self.client.prepare_index_params()
        # index_params.add_index(
        #     field_name="image_vector", #创建索引的字段名
        #     index_type="IVF_FLAT",     #指定索引的类型是 IVF_FLAT,高效的近似最近邻搜索（ANN）索引结构
        #     metric_type="COSINE",          #计算向量之间相似度或距离的度量类型是内积（Inner Product，简称IP）
        #     params={"nlist": 768}      #指定了 IVF_FLAT 索引类型需要的额外参数。nlist 指定了将向量空间划分为多少个分区（cells）,较大的 nlist 值可能导致更好的搜索质量，但也会增加索引构建和搜索的计算成本。
        # )
        # 创建集合
        collection = Collection(name=self.collection_name, schema=schema)
        # 创建索引
        # 索引构建时划分的子集数量。较大的 nlist 值可以提高索引质量，但会增加索引大小
        # nprobe：查询时搜索的子集数量。较大的 nprobe 值可以提高查询精度，但会增加查询时间。
        # "metric_type": "COSINE"，相似度计算
        index_params = {
            "index_type": "IVF_FLAT",
            "params": {"nlist": 1024},
            "metric_type": "COSINE"
        }
        collection.create_index(field_name="text_vector", index_params=index_params)
        # 加载集合到内存
        collection.load()
        time.sleep(2)
        logging.info(f"集合：{self.collection_name} 已经创建.")
    def search_data(self,vector):
        '''
        查询数据
        nprobe：查询时搜索的子集数量。较大的 nprobe 值可以提高查询精度，但会增加查询时间。
        '''
        try:
            # 搜索参数
            search_params = {
                "metric_type": "COSINE",
                "params": {}
            }
            # 进行搜索
            res = self.client.search(
                collection_name=self.collection_name,
                data=[vector],
                limit=100,  # 返回的最大搜索结果数量
                search_params=search_params,
                output_fields=["title", "segment", "answer"],
            )
            # 返回搜索结果
            result = res[0]
            return result
        except Exception as e:
            # 记录异常信息
            print(f"检索报错信息: {e}")
            # 返回 None 或者一个默认结果
            return None
        #根据相似度进行过滤
        # 根据客户设置的阈值，过滤掉不相似的数据，如果是sim = 0.3 .那么保留小于0.3的数据，越接近0，越相似
        # filtered_list = [obj for obj in result if obj['distance'] < sim]
        # print(result)

    def insert_data(self,data):
        '''
        导入数据，insert是直接导入，data import是批量导入
        当数据集较小，比如几千到几万条数据时，直接插入通常是高效且可行的。
        当数据集达到数百万条以上时，建议使用批量插入（Bulk Insert）或文件导入等方式来处理数据
        '''
        start_time = time.time()
        self.client.insert(
            collection_name=self.collection_name,
            data=data
        )
        cos_time = time.time()
        logging.info(f"导入{len(data)}条，所需的时间{cos_time - start_time}秒")