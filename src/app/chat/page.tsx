'use client';

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [selectedChat, setSelectedChat] = useState(1);

  const chats = [
    {
      id: 1,
      name: "Lisa",
      image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=60&h=60&fit=crop&crop=face",
      lastMessage: "Hey! How's your day going?",
      time: "2m ago",
      unread: 2
    },
    {
      id: 2,
      name: "Anna",
      image: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=60&h=60&fit=crop&crop=face",
      lastMessage: "Would love to chat more!",
      time: "1h ago",
      unread: 0
    },
    {
      id: 3,
      name: "Maya",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=60&h=60&fit=crop&crop=face",
      lastMessage: "Thanks for the match 😊",
      time: "3h ago",
      unread: 1
    }
  ];

  const messages = [
    { id: 1, sender: "Lisa", message: "Hey! How's your day going?", time: "2:30 PM", isMe: false },
    { id: 2, sender: "Me", message: "Hi Lisa! It's going well, thanks for asking 😊", time: "2:32 PM", isMe: true },
    { id: 3, sender: "Lisa", message: "That's great to hear! I saw you like hiking too", time: "2:35 PM", isMe: false },
    { id: 4, sender: "Me", message: "Yes! I love exploring new trails. Do you have any favorite spots?", time: "2:37 PM", isMe: true },
    { id: 5, sender: "Lisa", message: "Actually yes! There's this amazing trail in Central Park that has the best views", time: "2:40 PM", isMe: false }
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessage("");
    }
  };

  const selectedChatData = chats.find(chat => chat.id === selectedChat);

  return (
    <div className="h-full flex bg-gradient-to-br from-pink-50 to-red-50">
        {/* Chat List Sidebar */}
        <div className="w-80 bg-white shadow-lg overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold gradient-text">Messages</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={`p-4 cursor-pointer hover:bg-pink-50 transition-colors ${
                  selectedChat === chat.id ? 'bg-pink-100 border-r-2 border-pink-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={chat.image}
                      alt={chat.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-gray-800">{chat.name}</p>
                      <span className="text-xs text-gray-500">{chat.time}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                  </div>
                  {chat.unread > 0 && (
                    <div className="w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{chat.unread}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white shadow-sm p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <img
                src={selectedChatData?.image}
                alt={selectedChatData?.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-800">{selectedChatData?.name}</h3>
                <p className="text-sm text-green-500">Online now</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    msg.isMe
                      ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                      : 'bg-white shadow-sm text-gray-800'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${msg.isMe ? 'text-pink-100' : 'text-gray-500'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="bg-white p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-full border-gray-300 focus:border-pink-300"
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button
                onClick={handleSendMessage}
                className="w-12 h-12 rounded-full heart-gradient hover:scale-105 text-white transition-transform"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
    </div>
  );
};

export default Chat;
