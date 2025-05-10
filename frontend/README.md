# 目录
## 多Agent示例
hostAgentAPI： 多Agent示例，调用多个A2A的Agent一起协作
multiagent_front: 多Agent示例前端, 多个Agent的协作

### 1. 启动1个A2A的Agent
启动Agent RAG
```
cd backend/AgentRAG
python main.py --port 10005
```

启动第二个Agent， DeepSearch
```
cd backend/DeepSearch
python main.py --port 10004
```

### 2. 启动host Agent， 用于协调多个Agent，决定使用哪个Agent和查看Agent的状态等
cd hostAgentAPI
pip install -r requirements.txt
python api.py

### 3. 启动前端
cd multiagent_front
npm install
npm run dev


## 单个A2A的Agent的界面
single_agent: 单个Agent使用界面

### 1. 启动1个A2A的Agent
启动Agent RAG
```
cd backend/AgentRAG
python main.py --port 10005
```
### 2. 启动前端
cd single_agent
npm install
npm run dev