import { useState } from "react";
import type { FormEvent } from "react";
import { profileService } from "../services/profile.service";
import type { User } from "../types/api";
import { formatName } from "../utils/name";

type Props = {
  user: User;
  onUpdated: (user: User) => void;
};

export const ProfileEditor = ({ user, onUpdated }: Props) => {
  const [fullName, setFullName] = useState(formatName(user.fullName));
  const [bio, setBio] = useState(user.bio ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [status, setStatus] = useState("");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("");
    try {
      const updated = (await profileService.update({ fullName, bio, phone })) as User;
      onUpdated(updated);
      setStatus("Profile updated.");
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  return (
    <section className="card">
      <h3>Edit Profile</h3>
      <form className="grid-two" onSubmit={onSubmit}>
        <input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          onBlur={() => setFullName(formatName(fullName))}
          required
        />
        <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone" />
        <textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Bio" rows={3} />
        <button type="submit">Save Profile</button>
      </form>
      {status ? <p className="muted">{status}</p> : null}
    </section>
  );
};
