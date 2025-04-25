import React, { useState, useEffect, useRef } from "react";
import "./Chatbot.css";
import axios from "axios";
import ReactMarkdown from "react-markdown";

const Chatbot = () => {
  // State management for chat messages and flow control
  const [messages, setMessages] = useState([]); // Stores all chat messages
  const [currentFlow, setCurrentFlow] = useState([]); // Tracks current onboarding flow step
  const [showTypingBar, setShowTypingBar] = useState(true); // Controls typing bar visibility
  const [userInput, setUserInput] = useState(""); // Stores user input text
  const [showCommandPopup, setShowCommandPopup] = useState(false); // Controls command popup visibility
  const [isWaitingForInput, setIsWaitingForInput] = useState(false); // Tracks if waiting for user input
  const [showWelcome, setShowWelcome] = useState(true); // Controls welcome screen visibility
  const [isOnboardingActive, setIsOnboardingActive] = useState(false); // Tracks onboarding status
  const [showBackButton, setShowBackButton] = useState(false); // Controls back button visibility
  const [onboardingData, setOnboardingData] = useState({});
  
  // Refs and API configuration
  const chatboxRef = useRef(null); // Reference to chatbox container
  const API_URL = "https://w5sbw23kgi.execute-api.us-west-2.amazonaws.com/AutomatedAttribute";

  // Onboarding flow configuration
  const allSteps = {
    start: {
      type: "options",
      message: "Do you want to use an exisiting attribute? Attributes that are already onboarded to DPP are listed here: [SDLs](https://code.amazon.com/packages/DigitalPublishingTypes/trees/mainline/--/repository/attribute-schema/com/amazon/ingestion/dpp).",
      options: [
        { label: "Yes", next: "enterNamespace" },
        { label: "No", next: "pubcatAttributeName" }
      ]
    },
    enterNamespace: {
      type: "input",
      message: "Enter the namespace of your product. The corresponding namespace for a client token can be identified here: [DPPCPClientTokenConfig](https://code.amazon.com/packages/DPPCatalogPublisherService/blobs/mainline/--/brazil-config/app/DPPCatalogPublisherService.cfg)",
      next: "imsAttributeName"
    },
    pubcatAttributeName: {
      type: "input",
      message: "Lets create a new attribute, Can you enter the name of new pubcat Attribute",
      next: "pubcatAttributeSchema"
    },
    pubcatAttributeSchema: {
      type: "input",
      message: "Enter the pubcat Attribute Schema. Refer [defining the Attribute Schema in DPP](https://w.amazon.com/bin/view/DigitalPublishing/DPP2.0/Creating_new_attributes).",
      next: "enterNamespace"
    },
    imsAttributeName: {
      type: "input",
      message: "Enter the IMS Attribute Name. Refer [Marketplace Catalog Attributes](https://tiny.amazon.com/1427psrns/g2s2amazeditn2) to get appropriate IMS catalog attribute that suits your use-case.",
      next: "productGroup"
    },
    productGroup: {
      type: "options",
      message: "Select the product group for your attribute",      
      options: [
        { label: "Kindle", next: "isDigicatRequired" },
        { label: "Subscription", next: "isDigicatRequired" },
        { label: "DSV", next: "isDigicatRequired" },
        { label: "Bundle", next: "isDigicatRequired" },
        { label: "Android", next: "isDigicatRequired" }
      ]
    },
    isDigicatRequired: {
      type: "options",
      message: "Do you want to onboard this attribute to Digicat?",      
      options: [
        { label: "Yes", next: "isDPPOneRequired" },
        { label: "No", next: "isDPPOneRequired" }
      ]
    },
    isDPPOneRequired: {
      type: "options",
      message: "Do you want to onboard this attribute to DPP 1.0?",      
      options: [
        { label: "Yes", next: "attributeFlowEnds" },
        { label: "No", next: "attributeFlowEnds" }
      ]
    },
    attributeFlowEnds: {
      type: "text",
      message: "Thank you for providing all the information! I'm now processing your attribute onboarding request..."
    }
  };


  /**
   * Resets the chat to the main menu state
   */
  const handleBackToMain = () => {
    setMessages([{
      text: "Hi, how can I help you?",
      isBot: true,
      cards: [
        { title: "Onboarding", bg: "from-purple-500 to-blue-400", label: "/onboarding" },
        { title: "Dev", bg: "from-blue-300 to-yellow-300" },
        { title: "Error", bg: "from-pink-300 to-yellow-200" }
      ]
    }]);
    setShowWelcome(true);
    setIsOnboardingActive(false);
    setCurrentFlow([]);
    setShowBackButton(false);
  };

  /**
   * Starts the onboarding flow
   */
  const startOnboardingFlow = () => {
    setMessages([]);
    const firstStep = allSteps["start"];
    setMessages([{ 
      text: firstStep.message, 
      isBot: true,
      options: firstStep.options 
    }]);
    setCurrentFlow([allSteps[firstStep.next]]);
    setIsOnboardingActive(true);
    setShowTypingBar(false);
    setShowWelcome(false);
    setShowBackButton(true);
  };

  /**
   * Renders the next step in the onboarding flow
   */
  const renderNextStep = () => {
    const nextMessage = currentFlow[0];
    if (!nextMessage) return;
  
    if (nextMessage.type === "text") {
      setMessages((prev) => [...prev, { 
        text: nextMessage.message, 
        isBot: true 
      }]);
      setCurrentFlow((prev) => prev.slice(1));
    } else if (nextMessage.type === "options") {
      setMessages((prev) => [...prev, { 
        text: nextMessage.message, 
        isBot: true, 
        options: nextMessage.options 
      }]);
      setCurrentFlow((prev) => prev.slice(1));
    } else if (nextMessage.type === "input") {
      setMessages((prev) => [...prev, { 
        text: nextMessage.message, 
        isBot: true, 
        type: "input" 
      }]);
      setIsWaitingForInput(true);
    }
  };

  // Effect to handle flow progression
  useEffect(() => {
    if (!isWaitingForInput && currentFlow.length > 0) {
      renderNextStep();
    }
  }, [currentFlow, isWaitingForInput]);

  // Effect to set initial welcome message
  useEffect(() => {
    if (!isOnboardingActive) {
      setMessages([{
        text: "Hi, how can I help?",
        isBot: true,
        cards: [
          { title: "Onboarding", bg: "from-purple-500 to-blue-400", label: "/onboarding" },
          { title: "Dev", bg: "from-blue-300 to-yellow-300" },
          { title: "Error", bg: "from-pink-300 to-yellow-200" }
        ]
      }]);
    }
  }, [isOnboardingActive]);

  // Effect to auto-scroll chatbox
  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages]);

  /**
   * Handles option selection in the onboarding flow
   */
  const handleOption = (option) => {
    const userMessage = { text: option.label, isBot: false };
    setMessages((prev) => [...prev, userMessage]);
    
    // Get the current step name (the key from allSteps)
    const currentStepName = Object.keys(allSteps).find(
      key => allSteps[key] === currentFlow[0]
    );
    
    // Store the response
    if (currentStepName) {
      setOnboardingData(prev => ({
        ...prev,
        [currentStepName]: option.label
      }));
    }
  
    if (option.next === "attributeFlowEnds") {
      sendOnboardingData();
      setIsOnboardingActive(false);
    }
  
    if (option.next && allSteps[option.next]) {
      setCurrentFlow([allSteps[option.next]]);
    } else {
      setMessages((prev) => [
        ...prev,
        { text: "I'm not sure what you're saying \"No\" to. Could you please clarify?", isBot: true }
      ]);
      setShowTypingBar(true);
    }
  };

  /**
   * Handles user input submission during onboarding
   */
  const handleInputSubmit = (input) => {
    const inputStep = currentFlow[0];
    const nextKey = inputStep?.next;
  
    const userMessage = { text: input, isBot: false };
    const updatedMessages = [...messages, userMessage];
    const updatedFlow = currentFlow.slice(1);
    
    // Get the current step name
    const currentStepName = Object.keys(allSteps).find(
      key => allSteps[key] === currentFlow[0]
    );
    
    // Store the response
    if (currentStepName) {
      setOnboardingData(prev => ({
        ...prev,
        [currentStepName]: input
      }));
    }
  
    if (nextKey && allSteps[nextKey]) {
      updatedFlow.unshift(allSteps[nextKey]);
    }
  
    setMessages(updatedMessages);
    setCurrentFlow(updatedFlow);
    setIsWaitingForInput(false);
  };

  const sendOnboardingData = async () => {
    try {
      // Format the prompt from collected data
      const prompt = Object.entries(onboardingData)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
  
      // Structure the request exactly like your working example
      const requestPayload = {
        kb: "attribute_onboarding", // Changed from "codebase" to distinguish flows
        prompt: prompt
      };
  
      console.log("Sending to Lambda:", requestPayload); // For debugging
  
      const { data } = await axios.post(API_URL, requestPayload);
  
      setMessages(prev => [...prev, {
        text: data.response || "Attribute onboarding submitted successfully!",
        isBot: true
      }]);
  
    } catch (error) {
      console.error("Onboarding submission error:", error);
      
      let errorMessage = "Sorry, something went wrong. Please try again.";
      if (error.response?.data?.error) {
        errorMessage = `Error: ${error.response.data.error}`;
      }
  
      setMessages(prev => [...prev, {
        text: errorMessage,
        isBot: true
      }]);
    } finally {
      setOnboardingData({});
    }
  };


  /**
   * Handles input change and detects command trigger
   */
  const handleInputChange = (e) => {
    const value = e.target.value;
    setUserInput(value);
    setShowCommandPopup(value === "/");
  };

  /**
   * Auto-resizes textarea as user types
   */
  const handleInput = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  /**
   * Handles Enter key press for message submission
   */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Handles sending a message
   */
  const handleSendMessage = () => {
    if (userInput.trim() !== "") {
      const newMessages = [...messages, { text: userInput, isBot: false }];
      setMessages(newMessages);
      setUserInput("");
      setShowWelcome(false);
      setShowBackButton(true);
      
      if (!isOnboardingActive) {
        handleBotResponse(userInput);
      } else {
        handleInputSubmit(userInput);
      }
    }
  };

  /**
   * Handles option clicks (both onboarding and regular options)
   */
  const handleOptionClick = async (option) => {
    if (!isOnboardingActive) {
      setShowBackButton(true);
    }
  
    if (option.label === "/onboarding") {
      startOnboardingFlow();
      return;
    }
  
    if (isOnboardingActive || currentFlow.length > 0) {
      handleOption(option);
      return;
    }
  
    const userMessage = { text: option.label, isBot: false };
    setMessages((prev) => [...prev, userMessage]);
  
    try {
      const { data } = await axios.post(API_URL, {
        kb: "codebase",
        prompt: option.label
      });
      
      setMessages((prev) => [...prev, {
        text: data.response || data.message,
        isBot: true,
        options: data.options || null
      }]);
    } catch (error) {
      console.error("Error calling Lambda:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Sorry, something went wrong. Please try again.", isBot: true }
      ]);
    }
  };

  /**
   * Handles bot responses for regular queries
   */
  const handleBotResponse = async (input) => {
    if (isOnboardingActive) return;
  
    setShowBackButton(true);
  
    try {
      const { data } = await axios.post(API_URL, {
        kb: "codebase",
        prompt: input
      });
  
      setMessages((prev) => [...prev, {
        text: data.response || data.message,
        isBot: true,
        options: data.options || null
      }]);
    } catch (error) {
      console.error("Error calling Lambda:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Sorry, something went wrong. Please try again.", isBot: true }
      ]);
    }
  };

  return (
    <div className="chatbot-container">
      {/* Back button shown during conversations */}
      {showBackButton && !showWelcome && (
        <button 
          className="chatbot-back-button" 
          onClick={handleBackToMain}
          aria-label="Back to main menu"
        >
          ←
        </button>
      )}
      
      <div className="chat-content">
        {/* Chat message container */}
        <div className="chatbox" ref={chatboxRef}>
          {showWelcome ? (
            // Welcome screen
            <div className="flex items-center justify-center min-h-screen py-10 text-white">
              <div className="text-center">
                {/* Chat icon */}
                <div className="chat-symbol mb-3">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"/>
                  </svg>
                </div>
                
                {/* Welcome text */}
                <h2 className="chatbot-welcome-sub">Welcome To Our Chatbot</h2>
                <h1 className="welcome-heading">How can I help?</h1>
                
                {/* Action buttons */}
                <div className="card-container justify-center items-center gap-4 w-full px-4 py-6 overflow-x-auto">
                  <button
                    onClick={() => handleOptionClick({ label: "/onboarding" })}
                    className="bubble-button bubble-onboarding flex-shrink-0 w-[120px]"
                  >
                    <p className="button-text text-lg font-semibold">/attr</p>
                    <p className="button-subheading">Attribute Onboarding</p>
                  </button>
                  <button
                    onClick={() => handleOptionClick({ label: "/dev" })}
                    className="bubble-button bubble-dev flex-shrink-0 w-[120px]"
                  >
                    <p className="button-text text-lg font-semibold">/dev</p>
                    <p className="button-subheading">Developer debugging</p>
                  </button>
                  <button
                    onClick={() => handleOptionClick({ label: "/error" })}
                    className="bubble-button bubble-error flex-shrink-0 w-[120px]"
                  >
                    <p className="button-text text-lg font-semibold">/code</p>
                    <p className="button-subheading">Understanding code base</p>
                  </button>
                  <button
                    onClick={() => handleOptionClick({ label: "/error" })}
                    className="bubble-button bubble-mkt flex-shrink-0 w-[120px]"
                  >
                    <p className="button-text text-lg font-semibold">/mkt</p>
                    <p className="button-subheading">Marketplace onboarding</p>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Chat messages display
            messages.map((msg, index) => (
              <div 
                key={index} 
                className={`message-bubble ${msg.isBot ? 'bot' : 'user'}`}
              >
                <div className="markdown-content">
                  <ReactMarkdown children={msg.text} />
                </div>
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

        {/* Input area */}
        <div className="typing-bar">
          <div className="typing-area">
            <textarea
              value={userInput}
              onChange={handleInputChange}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
            />
            {/* Send button */}
            <button 
              onClick={handleSendMessage} 
              aria-label="Send message"
              className="send-button"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Command popup */}
          {showCommandPopup && (
            <div className="command-popup-container">
              <div className="command-popup">
                {["/attr", "/dev", "/code", "/mkt"].map((cmd, idx) => (
                  <div
                    key={idx}
                    className="command-option"
                    onClick={() => {
                      setUserInput(cmd);
                      setShowCommandPopup(false);
                    }}
                  >
                    <span className="command-prefix">/</span>
                    <span className="command-text">{cmd.substring(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;