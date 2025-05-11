# How to Use Different Models

## OpenAI Models

### gpt-4o

1.  Create a `.env` file in your project and add the `OPENAI_API_KEY` environment variable with your OpenAI API Key as its value.
2.  Run the command: `python main.py --provider openai --model gpt-4o`

### o3-mini

1.  Create a `.env` file in your project and add the `OPENAI_API_KEY` environment variable with your OpenAI API Key as its value.
2.  Run the command: `python main.py --provider openai --model o3-mini`

## DeepSeek Models

### V3

1.  Create a `.env` file in your project and add the `DEEPSEEK_API_KEY` environment variable with your DeepSeek API Key as its value.
2.  Run the command: `python main.py --provider deepseek --model deepseek-chat`

## Important Notes

* Reasoning models do not currently support the use of tools, so using DeepSeek's R1 model will result in an error.
* If you want to simulate the reasoning process, you can use the SequentialThink model to simulate the reasoning process of R1.