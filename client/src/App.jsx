import { useState } from "react";
import ChatWindow from "./components/ChatWindow";

function App() {
  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [canWeChat, setCanWeChat] = useState(false);

  const handleSubmit = () => {
    setCanWeChat(true);
  };

  return (
    <>
      {canWeChat && (
        <ChatWindow
          userId={sender}
          contactId={receiver}
        />
      )}

      <div style={{}}>
        <input
          type="text"
          placeholder="sender"
          onChange={(e) => setSender(e.target.value)}
        />
        <input
          type="text"
          placeholder="receiver"
          onChange={(e) => setReceiver(e.target.value)}
        />
        <button onClick={handleSubmit}>submit</button>
      </div>
    </>
  );
}

export default App;
