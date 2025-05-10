# API接口

# 启动
python api.py


# Get event的数据
{
  "jsonrpc": "2.0",
  "id": "4c9c3e3de6814d46817ff2d49bbfc0db",
  "result": [
    {
      "id": "88cc5ed3-c28b-44c3-a83b-247076b382d8",
      "actor": "user",
      "content": {
        "role": "user",
        "parts": [
          {
            "type": "text",
            "text": "你好",
            "metadata": null
          }
        ],
        "metadata": {
          "conversation_id": "ec922cee-8664-40dc-9e89-aea8c8a55ae4",
          "message_id": "07fb8cd2-06bc-45c0-a8e0-357d23c285c5"
        }
      },
      "timestamp": 1746670055.805705
    },
    {
      "id": "f4469962-b3ac-4d1b-ba1f-4b3195fa209c",
      "actor": "user",
      "content": {
        "role": "user",
        "parts": [
          {
            "type": "text",
            "text": "Hello",
            "metadata": null
          }
        ],
        "metadata": {
          "conversation_id": "908f6994-69fb-4619-9b70-7c2c15122dfc",
          "message_id": "dc21f471-a3b9-42e1-8266-b101e0eb852b"
        }
      },
      "timestamp": 1746670290.967268
    },
    {
      "id": "be0187eb-db3a-4632-a1b9-55964021c4d5",
      "actor": "user",
      "content": {
        "role": "user",
        "parts": [
          {
            "type": "text",
            "text": "国网大连的价格是多少？",
            "metadata": null
          }
        ],
        "metadata": {
          "conversation_id": "aa769ad9-221b-44c7-b493-0cf4f5212253",
          "message_id": "53554617-9341-4c04-ac82-7eaaf125ff74"
        }
      },
      "timestamp": 1746685947.086226
    },
    {
      "id": "888a056b-d804-4aaa-9d62-515102458cb7",
      "actor": "LNG_Knowledge",
      "content": {
        "role": "user",
        "parts": [
          {
            "type": "text",
            "text": "国网大连的价格是多少？",
            "metadata": null
          }
        ],
        "metadata": {
          "conversation_id": "aa769ad9-221b-44c7-b493-0cf4f5212253",
          "message_id": "53554617-9341-4c04-ac82-7eaaf125ff74"
        }
      },
      "timestamp": 1746685957.138772
    },
    {
      "id": "7a5abf33-8062-46bc-afa4-b8ed16a6ed95",
      "actor": "LNG_Knowledge",
      "content": {
        "role": "agent",
        "parts": [
          {
            "type": "text",
            "text": "TaskState.WORKING",
            "metadata": null
          }
        ],
        "metadata": {
          "conversation_id": "aa769ad9-221b-44c7-b493-0cf4f5212253"
        }
      },
      "timestamp": 1746685957.180841
    },
    {
      "id": "5bc87616-487e-45af-a999-c39ed37f8d76",
      "actor": "LNG_Knowledge",
      "content": {
        "role": "agent",
        "parts": [
          {
            "type": "text",
            "text": "用户询问的是国网大连的价格，但需要明确是天然气工厂的价格还是接收站的价格。大连可能涉及LNG接收站，因此需要先确认国网大连是指工厂还是接收站。",
            "metadata": null
          }
        ],
        "metadata": {
          "conversation_id": "aa769ad9-221b-44c7-b493-0cf4f5212253",
          "message_id": "3d861632-d1d3-4996-a92b-dd07c3208117",
          "last_message_id": "53554617-9341-4c04-ac82-7eaaf125ff74"
        }
      },
      "timestamp": 1746685973.084571
    },
    {
      "id": "cb8b974b-3d6b-4c38-b45d-20cdc0b1877f",
      "actor": "LNG_Knowledge",
      "content": {
        "role": "agent",
        "parts": [
          {
            "type": "text",
            "text": "TaskState.WORKING",
            "metadata": null
          }
        ],
        "metadata": {
          "conversation_id": "aa769ad9-221b-44c7-b493-0cf4f5212253"
        }
      },
      "timestamp": 1746685973.092069
    },
    {
      "id": "8ba9f09f-7476-4d70-bf80-fa7ff82544b0",
      "actor": "LNG_Knowledge",
      "content": {
        "role": "agent",
        "parts": [
          {
            "type": "text",
            "text": "",
            "metadata": null
          }
        ],
        "metadata": {
          "conversation_id": "aa769ad9-221b-44c7-b493-0cf4f5212253",
          "message_id": "5786c1f2-738b-4157-9a23-388d7b25a9ee",
          "last_message_id": "53554617-9341-4c04-ac82-7eaaf125ff74"
        }
      },
      "timestamp": 1746685979.121979
    },
    {
      "id": "c2dffba4-8d83-444d-b891-d6749ff20375",
      "actor": "LNG_Knowledge",
      "content": {
        "role": "agent",
        "parts": [
          {
            "type": "text",
            "text": "TaskState.WORKING",
            "metadata": null
          }
        ],
        "metadata": {
          "conversation_id": "aa769ad9-221b-44c7-b493-0cf4f5212253"
        }
      },
      "timestamp": 1746685979.17709
    },
    {
      "id": "qBZEmgze",
      "actor": "host_agent",
      "content": {
        "role": "agent",
        "parts": [
          {
            "type": "text",
            "text": "你好！请问有什么可以帮您的吗？",
            "metadata": null
          }
        ],
        "metadata": {
          "conversation_id": "ec922cee-8664-40dc-9e89-aea8c8a55ae4"
        }
      },
      "timestamp": 1746698855.815698
    },
    {
      "id": "rKoxzBI7",
      "actor": "host_agent",
      "content": {
        "role": "agent",
        "parts": [
          {
            "type": "text",
            "text": "Hello! How can I assist you today? If you have a specific task or request, feel free to let me know, and I can delegate it to the appropriate remote agent for you.",
            "metadata": null
          }
        ],
        "metadata": {
          "conversation_id": "908f6994-69fb-4619-9b70-7c2c15122dfc"
        }
      },
      "timestamp": 1746699090.990618
    },
    {
      "id": "nyEArZWE",
      "actor": "host_agent",
      "content": {
        "role": "agent",
        "parts": [
          {
            "type": "data",
            "data": {
              "id": "call_0_d480ffa8-8936-4061-ab49-f12fd86cc10e",
              "args": {},
              "name": "list_remote_agents"
            },
            "metadata": null
          }
        ],
        "metadata": {
          "conversation_id": "aa769ad9-221b-44c7-b493-0cf4f5212253"
        }
      },
      "timestamp": 1746714747.107039
    },
    {
      "id": "Rntit8ip",
      "actor": "host_agent",
      "content": {
        "role": "user",
        "parts": [
          {
            "type": "data",
            "data": {
              "name": "LNG_Knowledge",
              "description": "新奥公司的LNG知识"
            },
            "metadata": null
          }
        ],
        "metadata": {
          "conversation_id": "aa769ad9-221b-44c7-b493-0cf4f5212253"
        }
      },
      "timestamp": 1746714751.665175
    },
    {
      "id": "kpCyX6a5",
      "actor": "host_agent",
      "content": {
        "role": "agent",
        "parts": [
          {
            "type": "data",
            "data": {
              "id": "call_0_1783fa77-070d-4c5c-9cd7-9435cd6c460d",
              "args": {
                "agent_name": "LNG_Knowledge",
                "message": "国网大连的价格是多少？"
              },
              "name": "send_task"
            },
            "metadata": null
          }
        ],
        "metadata": {
          "conversation_id": "aa769ad9-221b-44c7-b493-0cf4f5212253"
        }
      },
      "timestamp": 1746714751.669145
    }
  ],
  "error": null
}