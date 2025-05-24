'use client';

import { useEffect, useState } from "react";
import styles from './page.module.css';
import { saveImage } from "../../../lib/upload";
import ImagePicker from "../components/img/image_picker";

const Role = {
  USER: "User",
  BOT: "Bot"
};

function Chatbot() {
  const [chats, setChats] = useState([
    { role: Role.BOT, text: 'Hello there! How may I help you today?' }
  ]);
  const [text, setText] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [fileUpload, setFileUpload] = useState(false);
  const [summary, setSummary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState('');
  const [resp, setResp] = useState(false);

  const formatText = (text) => {
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedText = formattedText.replace(/\s{2,}/g, '<br />');
    return formattedText;
  };

  const userResponse = (text) => {
    setChats((prev) => [...prev, { role: Role.USER, text }]);
  };

  const botResponse = (text) => {
    setChats((prev) => [...prev, { role: Role.BOT, text: formatText(text) }]);
  };

  const fetchData = async () => {
    const query_text = chats[chats.length - 1].text;
    const response = await fetch('http://localhost:8005/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query_text })
    });
    if (!response.ok) throw new Error('Query request failed');
    const data = await response.json();
    return data.response;
  };

  const fetchPrediction = async () => {
    const requestBody = { query: prediction };
    const response = await fetch('http://localhost:8006/prediction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) throw new Error('Prediction request failed');
    const data = await response.json();
    return data.response;
  };

  const fetchResponse = async () => {
    const requestBody = { query: prediction };
    const response = await fetch('http://localhost:8005/response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) throw new Error('Response request failed');
    const data = await response.json();
    return data.response;
  };

  const onSend = async () => {
    if (fileUpload && !summary) {
      botResponse('Processing Image');
      setLoading(true);
      setSummary(true);
    } else if (!text.trim()) {
      return;
    } else {
      userResponse(text);
      setText('');
      setWaiting(true);
      setLoading(true);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  const handleFileSelect = (file) => {
    console.log("File selected:", file?.name);
    setFileUpload(true);
    setSummary(false);
  };

  useEffect(() => {
    const handleBotResponse = async () => {
      if (waiting) {
        try {
          const data = await fetchData();
          botResponse(data);
        } catch (error) {
          console.error(error);
          botResponse("I'm sorry, I'm encountering an error. Please try again later.");
        } finally {
          setWaiting(false);
          setLoading(false);
        }
      }
    };
    handleBotResponse();
  }, [waiting]);

  useEffect(() => {
    const handlePred = async () => {
      if (summary) {
        try {
          const summaryText = await fetchPrediction();
          botResponse(summaryText);
          setPrediction(summaryText);
          setResp(true);
        } catch (error) {
          console.error(error);
          botResponse("I'm sorry, I'm encountering an error. Please try again later.");
        } finally {
          setSummary(false);
          setFileUpload(false);
          setLoading(false);
        }
      }
    };
    handlePred();
  }, [summary]);

  useEffect(() => {
    const handleResp = async () => {
      if (resp) {
        try {
          const responseText = await fetchResponse();
          botResponse(responseText);
        } catch (error) {
          console.error(error);
          botResponse("I'm sorry, I'm encountering an error. Please try again later.");
        } finally {
          setResp(false);
          setLoading(false);
        }
      }
    };
    handleResp();
  }, [resp]);

  return (
    <div className={styles.chatContainer}>
      <h4 className={styles.chatTitle}>RESPIRA</h4>
      {uploadStatus && (
        <div className={`${styles.uploadStatus} ${uploadStatus.includes('failed') ? styles.error : ''}`}>
          {uploadStatus}
        </div>
      )}

      <div className={styles.chatBox}>
        {Array.isArray(chats) && chats.map((chat, index) => (
          <div
            key={index}
            className={chat.role === Role.USER ? styles.userMessage : styles.botMessage}
            dangerouslySetInnerHTML={{ __html: chat.text }}
          ></div>
        ))}
        {loading && (
          <div className={styles.botMessage}>
            <div className={styles.loadingDots}>
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.inputContainer}>
        <textarea
          className={styles.textInput}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here..."
          rows={2}
        />
        <form action={saveImage} className={styles.fileInputContainer}>
          <ImagePicker label="" name="image" onImageSelect={handleFileSelect} />
          <button type="button" className={styles.sendButton} onClick={onSend}>➤</button>
        </form>
      </div>
    </div>
  );
}

export default Chatbot;
