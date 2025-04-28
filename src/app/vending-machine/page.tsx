"use client";
import React, { useState } from "react";

// Dummy data for vending machine items
const vendingItems = [
  { row: 1, col: 1, name: "Cola", price: 2, count: 5, img: "🥤" },
  { row: 1, col: 2, name: "Chips", price: 1, count: 3, img: "🍟" },
  { row: 2, col: 1, name: "Candy", price: 1, count: 7, img: "🍬" },
  { row: 2, col: 2, name: "Water", price: 1, count: 6, img: "💧" },
  { row: 3, col: 1, name: "Juice", price: 3, count: 2, img: "🧃" },
  { row: 3, col: 2, name: "Cookie", price: 2, count: 4, img: "🍪" },
];

const sidebarOptions = ["Chat", "Notes", "Supplier Email"];

export default function VendingMachineGame() {
  const [cash, setCash] = useState(10);
  const [sidebar, setSidebar] = useState("Chat");
  const [notes, setNotes] = useState("");
  const [chat, setChat] = useState([
    { sender: "bot", text: "Hi! What can I help you with today?" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [supplierMsg, setSupplierMsg] = useState("");

  const handleBuy = (itemIdx: number) => {
    const item = vendingItems[itemIdx];
    if (item.count > 0 && cash >= item.price) {
      vendingItems[itemIdx].count -= 1;
      setCash(cash - item.price);
      alert(`You bought ${item.name}!`);
    } else if (item.count === 0) {
      alert("Out of stock!");
    } else {
      alert("Not enough cash!");
    }
  };

  const handleChatSend = () => {
    if (chatInput.trim()) {
      setChat([...chat, { sender: "user", text: chatInput }]);
      setTimeout(() => {
        setChat((c) => [
          ...c,
          { sender: "bot", text: "(Pretend this is a smart AI reply!)" },
        ]);
      }, 500);
      setChatInput("");
    }
  };

  // Layout: Sidebar | Center | Vending Machine
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-pink-400 font-comic">
      {/* TopBar */}
      <div className="flex items-center shadow-md rounded-b-2xl mb-2 bg-gradient-to-r from-yellow-200 to-orange-300 px-8 py-5">
        <span className="font-bold text-2xl">💰 Cash: ${cash}</span>
        <span className="font-mono text-lg text-white/70 ml-4">
          Vending Machine Game
        </span>
      </div>

      <div className="flex flex-row h-[calc(100vh-80px)] p-2 gap-5">
        {/* Sidebar */}
        <div className="bg-white rounded-2xl shadow-lg p-5 min-w-[140px] flex flex-col gap-4 items-stretch mr-2 h-full">
          {sidebarOptions.map((opt) => (
            <button
              key={opt}
              className={`rounded-xl py-3 font-bold text-lg shadow hover:scale-105 transition-all mb-1 ${
                sidebar === opt
                  ? "bg-yellow-200 text-gray-800"
                  : "bg-white text-gray-700"
              }`}
              onClick={() => setSidebar(opt)}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Center area */}
        <div className="bg-yellow-50 rounded-2xl shadow-lg flex-1 mx-2 p-5 flex flex-col min-w-[320px] max-w-[420px] h-full min-h-[400px]">
          {sidebar === "Chat" && (
            <div className="flex flex-col flex-1 h-full">
              <div className="flex-1 overflow-y-auto mb-2 bg-white rounded-xl p-3 shadow min-h-[180px] max-h-[300px]">
                {chat.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`my-1 ${
                      msg.sender === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    <span
                      className={`inline-block font-medium px-3 py-1 rounded-xl ${
                        msg.sender === "user" ? "bg-blue-100" : "bg-yellow-100"
                      }`}
                    >
                      {msg.text}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Say something..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 rounded-lg border-2 border-yellow-300 text-base px-3 py-2 mr-2 focus:outline-yellow-300"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleChatSend();
                  }}
                />
                <button
                  className="bg-gradient-to-r from-yellow-400 to-pink-400 text-white rounded-lg px-5 py-2 font-bold shadow transition-all hover:scale-105"
                  onClick={handleChatSend}
                >
                  Send
                </button>
              </div>
            </div>
          )}
          {sidebar === "Notes" && (
            <div className="flex-1 flex flex-col">
              <textarea
                className="rounded-xl border-2 border-yellow-300 text-base px-3 py-3 min-h-[180px] resize-y w-full mt-1 bg-white shadow"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write your notes here..."
              />
            </div>
          )}
          {sidebar === "Supplier Email" && (
            <div className="flex-1 flex flex-col gap-2">
              <div className="font-semibold mb-2">Send Restock Request</div>
              <textarea
                className="rounded-xl border-2 border-yellow-300 text-base px-3 py-3 min-h-[120px] resize-y w-full mt-1 bg-white shadow"
                value={supplierMsg}
                onChange={(e) => setSupplierMsg(e.target.value)}
                placeholder="Type your message to the supplier..."
              />
              <button
                className="bg-gradient-to-r from-yellow-400 to-pink-400 text-white rounded-lg px-5 py-2 font-bold shadow transition-all hover:scale-105 mt-2"
                onClick={() => {
                  alert("Pretend email sent to supplier!\n" + supplierMsg);
                  setSupplierMsg("");
                }}
              >
                Send Email
              </button>
            </div>
          )}
        </div>

        {/* Vending Machine table/grid */}
        <div className="bg-white rounded-2xl shadow-lg min-w-[360px] p-5 flex flex-col items-center h-full max-h-[600px] overflow-y-auto">
          <div className="font-bold text-2xl text-pink-500 mb-2 tracking-wide">
            Vending Machine
          </div>
          <table className="w-full text-base bg-white">
            <thead>
              <tr>
                <th>Row</th>
                <th>Col</th>
                <th>Item</th>
                <th>Price</th>
                <th>Count</th>
                <th>Buy</th>
              </tr>
            </thead>
            <tbody>
              {vendingItems.map((item, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 ? "bg-yellow-50" : "bg-blue-50"}
                >
                  <td>{item.row}</td>
                  <td>{item.col}</td>
                  <td className="text-2xl">
                    <span>{item.img}</span>{" "}
                    <span className="text-base">{item.name}</span>
                  </td>
                  <td>${item.price}</td>
                  <td>{item.count}</td>
                  <td>
                    <button
                      className="bg-gradient-to-r from-yellow-400 to-pink-400 text-white rounded-lg px-4 py-1 font-bold shadow transition-all hover:scale-105 disabled:opacity-50"
                      onClick={() => handleBuy(idx)}
                      disabled={item.count === 0 || cash < item.price}
                    >
                      Buy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
