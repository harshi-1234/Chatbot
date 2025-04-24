import React, { useState, useEffect, useRef } from "react";
import "./Chatbot.css";
import axios from "axios";
import ReactMarkdown from "react-markdown";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [showCommandPopup, setShowCommandPopup] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const chatboxRef = useRef(null);
  const API_URL = "https://w5sbw23kgi.execute-api.us-west-2.amazonaws.com/dev";

  useEffect(() => {
    setMessages([
      {
        text: "Hi, how can I help?",
        isBot: true,
        options: [
          { label: "/onboarding" },
          { label: "/dev" },
          { label: "/error" },
        ],
      },
    ]);
}, []);


  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setUserInput(value);
    if (value === "/") {
      setShowCommandPopup(true);
    } else {
      setShowCommandPopup(false);
    }
  };

  const handleInput = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  const handleSendMessage = () => {
    if (userInput.trim() !== "") {
      const newMessages = [...messages, { text: userInput, isBot: false }];
      setMessages(newMessages);
      setUserInput("");
      setShowWelcome(false);
      handleBotResponse(userInput);
    }
  };

  const handleOptionClick = async (option) => {
    setShowWelcome(false);
    const userMessage = { text: option.label, isBot: false };
    setMessages((prev) => [...prev, userMessage]);
    try {
      const { data } = await axios.post(API_URL, { prompt: option.label });
      const botMessage = {
        text: data.response || data.message,
        isBot: true,
        options: data.options || null,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error calling Lambda:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Sorry, something went wrong. Please try again.", isBot: true },
      ]);
    }
  };

  const handleBotResponse = async (input) => {
    try {
      const { data } = await axios.post(API_URL, { prompt: input });
      const botMessage = {
        text: data.response || data.message,
        isBot: true,
        options: data.options || null,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error calling Lambda:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Sorry, something went wrong. Please try again.", isBot: true },
      ]);
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chat-content">
        <div className="chatbox" ref={chatboxRef}>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message-bubble ${msg.isBot ? "bot" : "user"} ${
                msg.isBot && msg.options ? "centered-message" : ""
              }`}
            >
              <ReactMarkdown children={msg.text} />
              {msg.options && (
                <div className="bot-options">
                  {msg.options.map((option, i) => (
                    <button
                      key={i}
                      className="option-button"
                      onClick={() => handleOptionClick(option)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="typing-bar">
          <div className="typing-area">
            <textarea
              value={userInput}
              onChange={handleInputChange}
              onInput={handleInput}
              placeholder="Type your message..."
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>

          {showCommandPopup && (
            <div className="command-popup">
              {["/attribute onboarding", "/error analysing", "/dev", "/doc"].map(
                (cmd, idx) => (
                  <div
                    key={idx}
                    className="command-option"
                    onClick={() => {
                      setUserInput(cmd);
                      setShowCommandPopup(false);
                    }}
                  >
                    {cmd}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
