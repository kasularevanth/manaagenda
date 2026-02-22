import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { messagesService, type MessageableRecipient } from "../services/messages.service";
import { formatName } from "../utils/name";

function formatMessageTime(createdAt: string): string {
  const d = new Date(createdAt);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

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
  /** When set, fetches messageable recipients by role and shows a dropdown by name (no ID entry). */
  receiverRoleFilter?: "ADMIN" | "EMPLOYEE" | "CLIENT";
};

export const MessagesPanel = ({ currentUserId, title = "Messaging", receiverRoleFilter }: Props) => {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [recipients, setRecipients] = useState<MessageableRecipient[]>([]);
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

  const visibleMessages = useMemo(() => {
    const list =
      receiverRoleFilter
        ? messages.filter((item) =>
            item.senderId === currentUserId
              ? item.receiver?.role === receiverRoleFilter
              : item.sender?.role === receiverRoleFilter,
          )
        : messages;
    return [...list].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [currentUserId, messages, receiverRoleFilter]);

  const loadConversations = async () => {
    setError("");
    try {
      const data = (await messagesService.getConversations()) as MessageRecord[];
      setMessages(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const loadRecipients = async () => {
    if (!receiverRoleFilter) return;
    try {
      const data = await messagesService.getRecipients(receiverRoleFilter);
      setRecipients(data ?? []);
    } catch {
      setRecipients([]);
    }
  };

  useEffect(() => {
    void loadConversations();
  }, []);

  useEffect(() => {
    const pollId = window.setInterval(() => {
      void loadConversations();
    }, 3000);
    return () => window.clearInterval(pollId);
  }, []);

  useEffect(() => {
    void loadRecipients();
  }, [receiverRoleFilter]);

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

  const receiverLabel = (r: MessageableRecipient) => `${formatName(r.fullName)} (${r.role})`;

  return (
    <section className="card">
      <h3>{title}</h3>
      <form className="grid-two message-panel-form" onSubmit={onSend}>
        {receiverRoleFilter ? (
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            required
            aria-label={`Select recipient (${receiverRoleFilter})`}
          >
            <option value="">Select recipient by name</option>
            {recipients.map((r) => (
              <option key={r.id} value={r.id}>
                {receiverLabel(r)}
              </option>
            ))}
          </select>
        ) : (
          <input
            placeholder="Receiver user ID"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            required
          />
        )}
        <input
          placeholder="Write message"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <button type="submit">Send</button>
        <button type="button" onClick={() => { void loadConversations(); void loadRecipients(); }}>
          Refresh
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      <div className="list">
        <h4>Conversation partners</h4>
        {conversationUsers.length === 0 ? <p className="muted">No messages yet.</p> : null}
        {conversationUsers.map(([id, info]) => (
          <button key={id} className="pill" onClick={() => setTargetId(id)} type="button">
            {info.name} ({info.role ?? "—"})
          </button>
        ))}
      </div>
      <div className="list">
        <h4>Latest messages</h4>
        {visibleMessages.slice(0, 50).map((item) => (
          <div key={item.id} className="list-item message-item">
            <div className="message-item-header">
              <strong>{formatName(item.sender?.fullName) || item.senderId}</strong> →{" "}
              <strong>{formatName(item.receiver?.fullName) || item.receiverId}</strong>
              <span className="message-time" title={item.createdAt}>
                {formatMessageTime(item.createdAt)}
              </span>
            </div>
            <p>{item.content}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
