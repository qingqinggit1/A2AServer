import React from "react";
import { Link } from "react-router-dom";
import Header from "./Header"; // 记得引入 Header

export const Home = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-4">欢迎来到 A2A</h1>
          <p className="text-gray-500 text-lg mb-8">多 Agent 管理平台</p>
          <div className="grid gap-4">
            <Link to="/agents">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition">
                查看 Agent
              </button>
            </Link>
            <Link to="/start_conversations">
              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition">
                开始会话
              </button>
            </Link>
            <Link to="/conversations">
              <button className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition">
                会话记录
              </button>
            </Link>
            <Link to="/events">
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition">
                事件管理
              </button>
            </Link>
            <Link to="/settings">
              <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition">
                系统设置
              </button>
            </Link>
            <Link to="/tasks">
              <button className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition">
                任务管理
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
