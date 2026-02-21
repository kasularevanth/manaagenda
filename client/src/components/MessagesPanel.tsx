import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { messagesService } from "../services/messages.service";

type MessageRecord = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  sender?: { id: string; fullName: string };
  receiver?: { id: string; fullName: string };
};

type Props = {
  currentUserId: string;
};

export const MessagesPanel = ({ currentUserId }: Props) => {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [targetId, setTargetId] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const conversationUsers = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of messages) {
      const other =
        item.senderId === currentUserId
          ? { id: item.receiverId, name: item.receiver?.fullName ?? item.receiverId }
          : { id: item.senderId, name: item.sender?.fullName ?? item.senderId };
      map.set(other.id, other.name);
    }
    return Array.from(map.entries());
  }, [currentUserId, messages]);

  const loadConversations = async () => {
    setError("");
    try {
      const data = (await messagesService.getConversations()) as MessageRecord[];
      setMessages(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    void loadConversations();
  }, []);

  const onSend = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await messagesService.send({ receiverId: targetId, content });
      setContent("");
      await loadConversations();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section className="card">
      <h3>Messaging</h3>
      <p className="muted">Allowed pairs: Admin↔Employee, Admin↔Client, Client↔Employee</p>
      <form className="grid-two" onSubmit={onSend}>
        <input
          placeholder="Receiver user ID"
          value={targetId}
          onChange={(event) => setTargetId(event.target.value)}
          required
        />
        <input
          placeholder="Write message"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          required
        />
        <button type="submit">Send</button>
        <button type="button" onClick={() => void loadConversations()}>
          Refresh
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      <div className="list">
        <h4>Conversation partners</h4>
        {conversationUsers.length === 0 ? <p className="muted">No messages yet.</p> : null}
        {conversationUsers.map(([id, name]) => (
          <button key={id} className="pill" onClick={() => setTargetId(id)} type="button">
            {name} ({id.slice(0, 8)})
          </button>
        ))}
      </div>
      <div className="list">
        <h4>Latest messages</h4>
        {messages.slice(0, 20).map((item) => (
          <div key={item.id} className="list-item">
            <strong>{item.sender?.fullName ?? item.senderId}</strong> →{" "}
            <strong>{item.receiver?.fullName ?? item.receiverId}</strong>
            <p>{item.content}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
