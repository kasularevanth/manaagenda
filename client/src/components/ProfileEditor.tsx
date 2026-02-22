import { useState } from "react";
import type { FormEvent } from "react";
import { profileService } from "../services/profile.service";
import type { User } from "../types/api";
import { formatName, getInitials } from "../utils/name";

type Props = {
  user: User;
  onUpdated: (user: User) => void;
};

export const ProfileEditor = ({ user, onUpdated }: Props) => {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(formatName(user.fullName));
  const [bio, setBio] = useState(user.bio ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const displayName = formatName(user.fullName);
  const displayPhone = user.phone?.trim() || "";
  const displayBio = user.bio?.trim() || "";

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("");
    setSaving(true);
    try {
      const updated = (await profileService.update({ fullName, bio, phone })) as User;
      onUpdated(updated);
      setEditing(false);
      setStatus("Profile updated.");
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = () => {
    setFullName(formatName(user.fullName));
    setBio(user.bio ?? "");
    setPhone(user.phone ?? "");
    setStatus("");
    setEditing(true);
  };

  return (
    <section className="card profile-card">
      <div className="profile-card-header">
        <div className="profile-initials" aria-hidden="true">
          {getInitials(user.fullName)}
        </div>
        <div className="profile-header-text">
          <h2 className="profile-name">{displayName}</h2>
          {!editing && (
            <p className="profile-muted">
              Last updated on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}
        </div>
      </div>

      {!editing ? (
        <>
          <button type="button" className="profile-card-edit-btn" onClick={startEdit} aria-label="Edit profile">
            Edit
          </button>
          <div className="profile-details">
            <div className="profile-detail-row">
              <span className="profile-detail-label">Name</span>
              <span className="profile-detail-value">{displayName}</span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-detail-label">Email</span>
              <span className="profile-detail-value">{user.email}</span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-detail-label">Phone number</span>
              <span className={`profile-detail-value ${!displayPhone ? "empty" : ""}`}>
                {displayPhone || "Not set"}
              </span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-detail-label">Bio</span>
              <span className={`profile-detail-value ${!displayBio ? "empty" : ""}`}>
                {displayBio || "Not set"}
              </span>
            </div>
          </div>
        </>
      ) : (
        <form className="profile-edit-form" onSubmit={onSubmit}>
          <button type="button" className="profile-card-edit-btn" onClick={() => setEditing(false)}>
            Cancel
          </button>
          <div className="form-edit-fields">
            <div className="profile-detail-row">
              <label className="profile-detail-label" htmlFor="profile-fullName">
                Name
              </label>
              <input
                id="profile-fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => setFullName(formatName(fullName))}
                required
              />
            </div>
            <div className="profile-detail-row">
              <label className="profile-detail-label" htmlFor="profile-email">
                Email
              </label>
              <input
                id="profile-email"
                type="email"
                value={user.email}
                readOnly
                disabled
                aria-label="Email (read-only)"
              />
            </div>
            <div className="profile-detail-row">
              <label className="profile-detail-label" htmlFor="profile-phone">
                Phone number
              </label>
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
              />
            </div>
            <div className="profile-detail-row">
              <label className="profile-detail-label" htmlFor="profile-bio">
                Bio
              </label>
              <textarea
                id="profile-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Short bio"
                rows={3}
              />
            </div>
            <button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      )}

      {status ? <p className="muted profile-status">{status}</p> : null}
    </section>
  );
};
