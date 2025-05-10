import React from "react";
import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <header className="bg-white shadow-md p-4 flex items-center justify-between">
      <div className="text-2xl font-bold text-blue-600">
        <Link to="/">A2A</Link>
      </div>
      <nav className="flex space-x-4">
        <Link to="/agents" className="text-gray-600 hover:text-blue-600 font-medium">
          Agent
        </Link>
        <Link to="/start_conversations" className="text-gray-600 hover:text-green-600 font-medium">
          开始会话
        </Link>
        <Link to="/conversations" className="text-gray-600 hover:text-green-600 font-medium">
          会话记录
        </Link>
        <Link to="/events" className="text-gray-600 hover:text-purple-600 font-medium">
          事件
        </Link>
        <Link to="/settings" className="text-gray-600 hover:text-yellow-500 font-medium">
          设置
        </Link>
        <Link to="/tasks" className="text-gray-600 hover:text-red-500 font-medium">
          任务
        </Link>
      </nav>
    </header>
  );
};

export default Header;
