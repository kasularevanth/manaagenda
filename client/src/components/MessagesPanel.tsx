import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { messagesService } from "../services/messages.service";
import { formatName } from "../utils/name";

type MessageRecord = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  sender?: { id: string; fullName: string; role?: "ADMIN" | "EMPLOYEE" | "CLIENT" };
  receiver?: { id: string; fullName: string; role?: "ADMIN" | "EMPLOYEE" | "CLIENT" };
};

type Props = {
  currentUserId: string;
  title?: string;
  receiverRoleFilter?: "ADMIN" | "EMPLOYEE" | "CLIENT";
};

export const MessagesPanel = ({ currentUserId, title = "Messaging", receiverRoleFilter }: Props) => {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [targetId, setTargetId] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const conversationUsers = useMemo(() => {
    const map = new Map<string, { name: string; role?: "ADMIN" | "EMPLOYEE" | "CLIENT" }>();
    for (const item of messages) {
      const other =
        item.senderId === currentUserId
          ? {
              id: item.receiverId,
              name: formatName(item.receiver?.fullName) || item.receiverId,
              role: item.receiver?.role,
            }
          : {
              id: item.senderId,
              name: formatName(item.sender?.fullName) || item.senderId,
              role: item.sender?.role,
            };
      if (!receiverRoleFilter || other.role === receiverRoleFilter) {
        map.set(other.id, { name: other.name, role: other.role });
      }
    }
    return Array.from(map.entries());
  }, [currentUserId, messages, receiverRoleFilter]);

  const visibleMessages = useMemo(
    () =>
      receiverRoleFilter
        ? messages.filter((item) =>
            item.senderId === currentUserId
              ? item.receiver?.role === receiverRoleFilter
              : item.sender?.role === receiverRoleFilter,
          )
        : messages,
    [currentUserId, messages, receiverRoleFilter],
  );

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
      <h3>{title}</h3>
      <p className="muted">Allowed pairs: Admin↔Employee, Admin↔Client, Client↔Employee</p>
      <form className="grid-two" onSubmit={onSend}>
        <input
          placeholder={receiverRoleFilter ? `Receiver user ID (${receiverRoleFilter})` : "Receiver user ID"}
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
        {conversationUsers.map(([id, info]) => (
          <button key={id} className="pill" onClick={() => setTargetId(id)} type="button">
            {info.name} ({id.slice(0, 8)})
          </button>
        ))}
      </div>
      <div className="list">
        <h4>Latest messages</h4>
        {visibleMessages.slice(0, 20).map((item) => (
          <div key={item.id} className="list-item">
            <strong>{formatName(item.sender?.fullName) || item.senderId}</strong> →{" "}
            <strong>{formatName(item.receiver?.fullName) || item.receiverId}</strong>
            <p>{item.content}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
