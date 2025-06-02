from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForCausalLM
from flask_cors import CORS
import torch
import re

app = Flask(__name__)
CORS(app)

# 模型名稱與設定
model_name = "mistralai/Mistral-7B-Instruct-v0.1"
tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=True)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16,
    device_map="auto"
)

# 處理模型回應：清除 prompt、雜訊與特殊符號
def clean_reply(full_output, prompt):
    # 去除 prompt 部分
    reply = full_output.replace(prompt, "").strip()
    # 刪除非中英文符號
    reply = re.sub(r"[^\u4e00-\u9fffA-Za-z0-9.,!?，。！？：:()\s]", "", reply)
    # 保留前一段話，避免模型產出長篇胡言
    reply = reply.split("\n")[0]
    return reply.strip()

@app.route("/chatbot", methods=["POST"])
def chatbot():
    try:
        user_message = request.json.get("message", "").strip()
        if not user_message:
            return jsonify({"reply": "請輸入問題！"})

        # 建立指令式 Prompt 格式
        prompt = f"[INST] {user_message} 請用一句話簡潔說明。[/INST]"
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

        # 模型生成回應
        outputs = model.generate(
            **inputs,
            max_new_tokens=80,
            temperature=0.7,
            top_p=0.9,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )

        full_output = tokenizer.decode(outputs[0], skip_special_tokens=True)
        reply = clean_reply(full_output, prompt)

        return jsonify({"reply": reply if reply else "抱歉，我目前無法回答這個問題。"})

    except Exception as e:
        print("錯誤發生：", str(e))
        return jsonify({"reply": "系統發生錯誤，請稍後再試。"})

if __name__ == "__main__":
    app.run(port=7000)
