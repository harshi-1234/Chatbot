import React, { useState, useEffect, useRef } from "react";
import "./Chatbot.css";
import axios from "axios";
import ReactMarkdown from "react-markdown";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [currentFlow, setCurrentFlow] = useState([]);
const [showTypingBar, setShowTypingBar] = useState(true);
  const [userInput, setUserInput] = useState("");
  const [showCommandPopup, setShowCommandPopup] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const chatboxRef = useRef(null);
  const API_URL = "https://w5sbw23kgi.execute-api.us-west-2.amazonaws.com/AutomatedAttribute";


  const onboardingFlow = {
    onboarding: [
      {
        type: "text",
        message: "Attributes that are already onboarded to DPP are listed here: [SDLs](https://code.amazon.com/packages/DigitalPublishingTypes/trees/mainline/--/repository/attribute-schema/com/amazon/ingestion/dpp). Attribute you want to onboard is present in the list?"
      },
      {
        type: "options",
        options: [
          { label: "Yes", next: "text" },
          { label: "No", next: "namespace-attribute-sdl" }
        ]
      }
    ],

    "namespace-lookup": [
        {
          type: "text",
          message: "Enter your namespace (The corresponding namespace for a client token can be identified here: [DPPCPClientTokenConfig](https://code.amazon.com/packages/DPPCatalogPublisherService/blobs/mainline/--/brazil-config/app/DPPCatalogPublisherService.cfg))"
        },
        {
          type: "input",
          message: "Type your namespace:"
        }
      ],
      "namespace-attribute-sdl": [
        {
          "type": "text",
          "message": "Enter your namespace, attribute name, and SDL:"
        },
        {
          "type": "input",
          "message": "Type namespace, attribute name, and SDL:"
        }
      ] ,

      "ims-attribute-name": [
    {
      "type": "text",
      "message": "Enter IMS attribute name. (Refer [Marketplace Catalog Attributes](https://tiny.amazon.com/1427psrns/g2s2amazeditn2) G2S2 config to get the appropriate IMS catalog attribute that suits your use-case. To find the matching attribute, please use this [wiki](https://metadatawiki.selection.amazon.dev/))"
    },
    {
      "type": "input",
      "message": "Type IMS attribute name:"
    }
  ], "product-group": [
    {
      "type": "text",
      "message": "Select Product Group -> Kindle, Subscription, etc..."
    },
    {
      "type": "options",
      "options": [
        { "label": "Kindle", "next": "onboard-dpp1" },
        { "label": "Subscription", "next": "onboard-dpp1" },
        { "label": "Other", "next": "onboard-dpp1" }
      ]
    }
  ], 
  "onboard-dpp1": [
    {
      "type": "text",
      "message": "Do you want to onboard this attribute to DPP1.0?"
    },
    {
      "type": "options",
      "options": [
        { "label": "Yes", "next": "onboard-digicat" },
        { "label": "No", "next": "end" }
      ]
    }
  ],
  "onboard-digicat": [
    {
      "type": "text",
      "message": "Do you want to onboard this attribute to Digicat?"
    },
    {
      "type": "options",
      "options": [
        { "label": "Yes", "next": "end" },
        { "label": "No", "next": "end" }
      ]
    }
  ],
  "end": [
    {
      "type": "text",
      "message": "Thank you! Your onboarding process is complete."
    }
  ]
  };

  const startOnboardingFlow = () => {
    const flow = onboardingFlow.onboarding;
    setMessages((prev) => [...prev, { text: flow[0].message, isBot: true }]);
    renderNextStep(flow.slice(1));
  };
  


  const renderNextStep = (flow) => {
    if (flow.length === 0) return;
  
    const nextMessage = flow[0];
  
    if (nextMessage.type === "text") {
      setMessages((prev) => [...prev, { text: nextMessage.message, isBot: true }]);
    } else if (nextMessage.type === "options") {
      setMessages((prev) => [
        ...prev,
        {
          text: nextMessage.message,
          isBot: true,
          options: nextMessage.options,
        },
      ]);
    } else if (nextMessage.type === "input") {
      setMessages((prev) => [
        ...prev,
        { text: nextMessage.message, isBot: true, type: "input" },
      ]);
    }
  
    setCurrentFlow(flow.slice(1));
  };
  
  
// yes or no 
  const handleOption = (option) => {
    const userMessage = { text: option.label, isBot: false };
    setMessages((prev) => [...prev, userMessage]);
  
    if (option.next && onboardingFlow[option.next]) {
      const nextFlow = onboardingFlow[option.next];
      renderNextStep(nextFlow);
    } else {
      setMessages((prev) => [
        ...prev,
        { text: "I'm not sure what you're saying \"No\" to. Could you please clarify?", isBot: true }
      ]);
    }
  };
  
  
  // Handle input submission
  const handleInputSubmit = (input) => {
    const nextMessages = currentFlow.slice(1); // Get the next step
    setMessages((prev) => [...prev, { text: input, isBot: false }]);
    setCurrentFlow(nextMessages);
  };

  useEffect(() => {
    if (currentFlow.length > 0) {
      const nextMessage = currentFlow[0];
  
      // Push text messages
      if (nextMessage.type === "text") {
        setMessages((prev) => [...prev, { text: nextMessage.message, isBot: true }]);
  
        // Re-enable typing bar if it's the end message
        if (
          nextMessage.message.includes("onboarding process is complete") ||
          nextMessage.message.includes("Your onboarding process is complete")
        ) {
          setShowTypingBar(true);
        }
      }
  
      // Push options (Yes/No buttons etc.)
      else if (nextMessage.type === "options") {
        setMessages((prev) => [
          ...prev,
          {
            text: nextMessage.message,
            isBot: true,
            options: nextMessage.options,
          },
        ]);
      }
  
      // Push input prompts
      else if (nextMessage.type === "input") {
        setMessages((prev) => [
          ...prev,
          { text: nextMessage.message, isBot: true, type: "input" },
        ]);
      }
  
      // Move to next step in the flow
      setCurrentFlow(currentFlow.slice(1));
    }
  }, [currentFlow]);
  



  useEffect(() => {
    setMessages([
      {
        text: "Hi, how can I help?",
        isBot: true,
        cards: [
          {
            title: "Onboarding",
            bg: "from-purple-500 to-blue-400",
            image: "🧊",
            label: "/onboarding"
          },
          {
            title: "Dev",
            bg: "from-blue-300 to-yellow-300",
            image: "🎨",
          },
          {
            title: "Error",
            bg: "from-pink-300 to-yellow-200",
            image: "🎥",
          },
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
    if (option.label === "/onboarding") {
      setShowTypingBar(false); // Hide typing bar during onboarding
      setShowWelcome(false);   // Hide welcome UI
      startOnboardingFlow();   // Start the hardcoded flow
      return;
    }
  
    // If currentFlow is not empty, we're inside the onboarding JSON flow
    if (currentFlow.length > 0) {
      handleOption(option);  // This handles JSON-based branching
      return;
    }
  
    // Else, do API-based option click
    const userMessage = { text: option.label, isBot: false };
    setMessages((prev) => [...prev, userMessage]);
  
    try {
      const payload = {
        kb: "codebase",
        prompt: option.label,
      };
  
      const { data } = await axios.post(API_URL, payload);
  
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
      const payload = {
        kb: "codebase",  // same as above
        prompt: input,  // the user's input or query
      };
  
      const { data } = await axios.post(API_URL, payload);
  
      // Build the bot message with text and optional options
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
      {showWelcome ? (
  <div className="flex items-center justify-center min-h-screen py-10 text-white">
    <div className="text-center">
      <div className="mb-2 text-blue-300 text-3xl">✨</div>
      <p className="text-gray-400 text-sm">Welcome to Leonardo AI</p>
      <h1 className="text-white font-bold">How can I help?
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 py-6">
        {[
          {
            title: "Onboarding",
            label: "/onboarding",
            bg: "from-purple-500 to-blue-400",
            image: "🧊",
          },
          {
            title: "Dev",
            label: "/dev",
            bg: "from-blue-300 to-yellow-300",
            image: "🎨",
          },
          {
            title: "Error",
            label: "/error",
            bg: "from-pink-300 to-yellow-200",
            image: "🎥",
          },
        ].map((card, idx) => (
          <button
            key={idx}
            onClick={() => handleOptionClick({ label: card.label })}
            className={`w-full h-24 rounded-3xl p-5 bg-gradient-to-br ${card.bg} text-white shadow-xl flex flex-col justify-between hover:scale-105 transition-transform duration-300 cursor-pointer`}
          >
            <h2 className="text-lg font-semibold">{card.title}</h2>
            <div className="text-5xl text-right">{card.image}</div>
          </button>
        ))}
      </div>
    </div>
  </div>
) : (
  messages.map((msg, index) => (
    <div
      key={index}
      className={`message-bubble ${msg.isBot ? "bot" : "user"} ${
        msg.isBot && msg.options ? "centered-message" : ""
      }`}
    >
      <ReactMarkdown children={msg.text} />
      {msg.cards && (
        <div className="grid grid-cols-3 gap-6 mt-4">
          {msg.cards.map((card, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionClick({ label: card.label })}
              className={`w-full h-24 rounded-3xl p-5 bg-gradient-to-br ${card.bg} text-white shadow-xl flex flex-col justify-between hover:scale-105 transition-transform duration-300 cursor-pointer`}
            >
              <h2 className="text-lg font-semibold">{card.title}</h2>
              <div className="text-5xl text-right">{card.image}</div>
            </button>
          ))}
        </div>
      )}

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
  ))
)}

</div>


        <div className="typing-bar">
          <div className="typing-area">
          <textarea
  value={userInput}
  onChange={handleInputChange}
  onInput={handleInput}
  onKeyDown={handleKeyDown}
  placeholder="Type your message..."
/>
<button onClick={handleSendMessage} aria-label="Send message">Send</button>
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
