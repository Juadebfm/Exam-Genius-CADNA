import { useState, useEffect } from "react";
import { IoPersonOutline, IoTrashOutline } from "react-icons/io5";
import Sidebar from "../components/Layout/Sidebar";
import Header from "../components/Layout/Header";
import { apiClient, API_ENDPOINTS } from "../config/api";
import { useNavigate } from "react-router-dom";

// ─── Toggle ───────────────────────────────────────────────────────────────────
const Toggle = ({ value, onChange, disabled }) => (
  <button
    onClick={() => !disabled && onChange(!value)}
    disabled={disabled}
    style={{
      position: "relative",
      display: "inline-flex",
      width: "44px",
      height: "24px",
      alignItems: "center",
      borderRadius: "9999px",
      border: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      backgroundColor: value ? "#2563EB" : "#D1D5DB",
      transition: "background-color 0.2s",
      flexShrink: 0,
      opacity: disabled ? 0.6 : 1,
    }}
    aria-checked={value}
    role="switch"
  >
    <span
      style={{
        display: "inline-block",
        width: "18px",
        height: "18px",
        borderRadius: "50%",
        backgroundColor: "#fff",
        transform: value ? "translateX(22px)" : "translateX(3px)",
        transition: "transform 0.2s",
      }}
    />
  </button>
);

// ─── Delete Modal ─────────────────────────────────────────────────────────────
const DeleteModal = ({ onClose, onConfirm, loading }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 50,
    }}
  >
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "28px",
        maxWidth: "400px",
        width: "90%",
      }}
    >
      <h3
        style={{
          fontSize: "18px",
          fontWeight: "600",
          marginBottom: "12px",
          color: "#111827",
        }}
      >
        Delete Account
      </h3>
      <p
        style={{
          color: "#6B7280",
          fontSize: "14px",
          marginBottom: "24px",
          lineHeight: 1.6,
        }}
      >
        Are you sure you want to delete your account? This action cannot be
        undone and all your data will be permanently removed.
      </p>
      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            padding: "8px 20px",
            borderRadius: "8px",
            border: "1px solid #D1D5DB",
            background: "#fff",
            color: "#374151",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          style={{
            padding: "8px 20px",
            borderRadius: "8px",
            border: "none",
            background: "#DC2626",
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "14px",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Deleting..." : "Delete Account"}
        </button>
      </div>
    </div>
  </div>
);

// ─── Change Password Modal ────────────────────────────────────────────────────
const ChangePasswordModal = ({ onClose, userId }) => {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.current || !form.next || !form.confirm)
      return setError("All fields are required.");
    if (form.next !== form.confirm)
      return setError("New passwords do not match.");
    if (form.next.length < 8)
      return setError("Password must be at least 8 characters.");
    setError("");
    setLoading(true);
    try {
      await apiClient.put(`/api/users/${userId}/password`, {
        currentPassword: form.current,
        newPassword: form.next,
      });
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "28px",
          maxWidth: "400px",
          width: "90%",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "600",
            marginBottom: "20px",
            color: "#111827",
          }}
        >
          Change Password
        </h3>
        {[
          { key: "current", label: "Current password" },
          { key: "next", label: "New password" },
          { key: "confirm", label: "Confirm new password" },
        ].map(({ key, label }) => (
          <div key={key} style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "#6B7280",
                marginBottom: "4px",
              }}
            >
              {label}
            </label>
            <input
              type="password"
              value={form[key]}
              onChange={(e) =>
                setForm((p) => ({ ...p, [key]: e.target.value }))
              }
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #D1D5DB",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>
        ))}
        {error && (
          <p
            style={{ color: "#DC2626", fontSize: "13px", marginBottom: "12px" }}
          >
            {error}
          </p>
        )}
        {success && (
          <p
            style={{ color: "#16A34A", fontSize: "13px", marginBottom: "12px" }}
          >
            Password changed successfully!
          </p>
        )}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            marginTop: "8px",
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: "1px solid #D1D5DB",
              background: "#fff",
              color: "#374151",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: "none",
              background: "#2563EB",
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "14px",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
const EditProfileModal = ({ profile, userId, onClose, onSaved }) => {
  const [draft, setDraft] = useState({ ...profile });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar || "");

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiClient.put(`/api/users/${userId}`, {
        firstName: draft.firstName,
        lastName: draft.lastName,
        phone: draft.phone,
        institution: draft.institution,
        purposeOfUse: draft.purposeOfUse,
        department: draft.department,
      });
      const u = data?.data || data?.user || data || {};
      onSaved({
        firstName: u.firstName || draft.firstName,
        lastName: u.lastName || draft.lastName,
        phone: u.phone || draft.phone,
        email: u.email || draft.email,
        institution: u.institution || draft.institution,
        purposeOfUse: u.purposeOfUse || draft.purposeOfUse,
        department: u.department || draft.department,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = {
    width: "100%",
    padding: "10px 12px 10px 36px",
    border: "1px solid #E5E7EB",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#111827",
    background: "#fff",
    boxSizing: "border-box",
    outline: "none",
  };
  const wrapStyle = { position: "relative" };
  const iconStyle = {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9CA3AF",
    pointerEvents: "none",
  };

  const purposeOptions = [
    "Academic Studies",
    "Professional Development",
    "Research",
    "Personal Learning",
    "Corporate Training",
    "Other",
  ];

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
          padding: "16px",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "700px",
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", padding: "32px 32px 0" }}>
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                display: "none",
              }}
            />
            <h2
              style={{
                fontSize: "22px",
                fontWeight: "700",
                color: "#111827",
                margin: "0 0 4px",
              }}
            >
              User Profile
            </h2>
            <p
              style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 24px" }}
            >
              View and manage user details
            </p>

            {/* Avatar */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "32px",
              }}
            >
              <div style={{ position: "relative", display: "inline-block" }}>
                <div
                  style={{
                    width: "90px",
                    height: "90px",
                    borderRadius: "50%",
                    background: "#DBEAFE",
                    border: "3px solid #93C5FD",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "32px",
                    fontWeight: "600",
                    color: "#2563EB",
                    overflow: "hidden",
                  }}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="avatar"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : draft.firstName || draft.lastName ? (
                    `${draft.firstName?.[0] ?? ""}${draft.lastName?.[0] ?? ""}`
                  ) : (
                    <IoPersonOutline size={40} color="#2563EB" />
                  )}
                </div>
                <label
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: "#2563EB",
                    border: "2px solid #fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setAvatarPreview(URL.createObjectURL(file));
                      setAvatarLoading(true);
                      try {
                        const formData = new FormData();
                        formData.append("avatar", file);
                        const token = localStorage.getItem("authToken");
                        const res = await fetch(
                          `${import.meta.env.VITE_API_URL || "https://cadna-backend-kpgj.onrender.com"}/api/users/${userId}/avatar`,
                          {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` },
                            body: formData,
                          },
                        );
                        const data = await res.json();
                        if (!data.success) throw new Error(data.message);
                        const newUrl = data.data?.avatar || "";
                        setAvatarPreview(newUrl);
                        setDraft((p) => ({ ...p, avatar: newUrl }));
                        onSaved({ ...draft, avatar: newUrl });
                      } catch (err) {
                        setError(err.message || "Failed to upload image.");
                        setAvatarPreview(profile.avatar || "");
                      } finally {
                        setAvatarLoading(false);
                      }
                    }}
                  />
                  {avatarLoading ? (
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        border: "2px solid #fff",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                  ) : (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2.5"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  )}
                </label>
              </div>
            </div>
          </div>

          <div style={{ padding: "0 32px 32px" }}>
            {error && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  marginBottom: "20px",
                  color: "#991B1B",
                  fontSize: "13px",
                }}
              >
                {error}
              </div>
            )}

            {/* User Information */}
            <h3
              style={{
                fontSize: "15px",
                fontWeight: "600",
                color: "#111827",
                margin: "0 0 16px",
              }}
            >
              User Information
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "28px",
              }}
            >
              {[
                { label: "First Name", name: "firstName", icon: "person" },
                { label: "Last Name", name: "lastName", icon: "person" },
                {
                  label: "Phone Number",
                  name: "phone",
                  icon: "phone",
                  type: "tel",
                },
                {
                  label: "Email Address",
                  name: "email",
                  icon: "email",
                  readOnly: true,
                },
              ].map((f) => (
                <div key={f.name}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "#6B7280",
                      marginBottom: "6px",
                    }}
                  >
                    {f.label}
                  </label>
                  <div style={wrapStyle}>
                    <span style={iconStyle}>
                      {f.icon === "person" && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                        </svg>
                      )}
                      {f.icon === "phone" && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.28a16 16 0 0 0 6.26 6.26l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      )}
                      {f.icon === "email" && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      )}
                    </span>
                    <input
                      type={f.type || "text"}
                      value={draft[f.name]}
                      readOnly={f.readOnly}
                      onChange={(e) =>
                        !f.readOnly &&
                        setDraft((p) => ({ ...p, [f.name]: e.target.value }))
                      }
                      placeholder={f.label}
                      style={{
                        ...fieldStyle,
                        ...(f.readOnly
                          ? {
                              background: "#F9FAFB",
                              cursor: "not-allowed",
                              opacity: 0.7,
                            }
                          : {}),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Academic/Professional Details */}
            <h3
              style={{
                fontSize: "15px",
                fontWeight: "600",
                color: "#111827",
                margin: "0 0 16px",
              }}
            >
              Academic/Professional details
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              {/* Purpose of Use — dropdown */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    color: "#6B7280",
                    marginBottom: "6px",
                  }}
                >
                  Purpose of Use
                </label>
                <div style={wrapStyle}>
                  <span style={iconStyle}>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  </span>
                  <select
                    value={draft.purposeOfUse}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, purposeOfUse: e.target.value }))
                    }
                    style={{
                      ...fieldStyle,
                      appearance: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">Select Purpose</option>
                    {purposeOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <span style={{ ...iconStyle, left: "auto", right: "12px" }}>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </div>
              </div>

              {/* Institution */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    color: "#6B7280",
                    marginBottom: "6px",
                  }}
                >
                  Institution
                </label>
                <div style={wrapStyle}>
                  <span style={iconStyle}>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={draft.institution}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, institution: e.target.value }))
                    }
                    placeholder="Enter Institution"
                    style={fieldStyle}
                  />
                </div>
              </div>
            </div>

            {/* Department — full width */}
            <div style={{ marginBottom: "32px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "#6B7280",
                  marginBottom: "6px",
                }}
              >
                Department
              </label>
              <div style={wrapStyle}>
                <span style={iconStyle}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={draft.department}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, department: e.target.value }))
                  }
                  placeholder="Enter Department"
                  style={fieldStyle}
                />
              </div>
            </div>

            {/* Update Profile Button */}
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                border: "none",
                background: loading ? "#93C5FD" : "#2563EB",
                color: "#fff",
                fontSize: "15px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const StudentSettings = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("userPrefs") || "{}").darkMode ?? false
      );
    } catch {
      return false;
    }
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [togglingKey, setTogglingKey] = useState(null);

  const [userId, setUserId] = useState(null);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    institution: "",
    purposeOfUse: "",
    department: "",
    avatar: "",
  });
  const [draftProfile, setDraftProfile] = useState({ ...profile });

  const [settings, setSettings] = useState({
    twoFactorAuth: false,
    examReminder: false,
    resultAlerts: false,
    systemUpdates: false,
    webcamAccess: false,
    microphoneAccess: false,
  });

  // ── Fetch profile on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        // Step 1: get current user's ID from /api/auth/me
        const meData = await apiClient.get(API_ENDPOINTS.ME);
        const me = meData.user || meData.data || meData;
        const id = me._id || me.id;
        if (!id) throw new Error("Could not determine user ID.");
        setUserId(id);

        // Step 2: fetch full profile using the ID
        const profileData = await apiClient.get(`/api/users/${id}`);
        const u = profileData.data || profileData.user || profileData;
        const mapped = {
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          phone: u.phone || "",
          email: u.email || "",
          institution: u.institution || u.university || "",
          purposeOfUse: u.purposeOfUse || "",
          department: u.department || "",
          avatar: u.avatar || "",
        };
        setProfile(mapped);
        setDraftProfile(mapped);

        // Restore locally-stored preferences
      } catch (err) {
        setPageError(err.message || "Failed to load profile.");
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, []);

  // ── Save profile ────────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!userId) return;
    setSaveLoading(true);
    setSaveError("");
    try {
      const data = await apiClient.put(`/api/users/${userId}`, {
        firstName: draftProfile.firstName,
        lastName: draftProfile.lastName,
        phone: draftProfile.phone,
        university: draftProfile.institution,
        institution: draftProfile.institution,
        purposeOfUse: draftProfile.purposeOfUse,
        department: draftProfile.department,
      });
      const u = data?.data || data?.user || data || {};
      setProfile({
        firstName: u.firstName || draftProfile.firstName,
        lastName: u.lastName || draftProfile.lastName,
        phone: u.phone || draftProfile.phone,
        email: u.email || draftProfile.email,
        institution: u.institution || draftProfile.institution,
        purposeOfUse: u.purposeOfUse || draftProfile.purposeOfUse,
        department: u.department || draftProfile.department,
      });
      setEditingProfile(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || "Failed to save profile.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setDraftProfile({ ...profile });
    setEditingProfile(false);
    setSaveError("");
  };

  // ── Toggle with optimistic UI ───────────────────────────────────────────────
  const handleToggle = async (key) => {
    const newVal = !settings[key];
    setSettings((p) => ({ ...p, [key]: newVal })); // optimistic
    setTogglingKey(key);
    try {
      if (key === "twoFactorAuth") {
        await apiClient.post(API_ENDPOINTS.SETUP_2FA, { enabled: newVal });
      } else {
        // Persist notification / permission prefs locally
        const prefs = JSON.parse(localStorage.getItem("userPrefs") || "{}");
        localStorage.setItem(
          "userPrefs",
          JSON.stringify({ ...prefs, [key]: newVal }),
        );
      }
    } catch (err) {
      setSettings((p) => ({ ...p, [key]: !newVal })); // revert
      console.error(`Toggle ${key} failed:`, err.message);
    } finally {
      setTogglingKey(null);
    }
  };

  // ── Dark mode (persisted locally) ──────────────────────────────────────────
  const handleDarkMode = (val) => {
    setDarkMode(val);
    const prefs = JSON.parse(localStorage.getItem("userPrefs") || "{}");
    localStorage.setItem(
      "userPrefs",
      JSON.stringify({ ...prefs, darkMode: val }),
    );
  };

  // ── Delete account ──────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!userId) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/api/users/${userId}`);
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userPrefs");
      window.location.href = "/signin";
    } catch (err) {
      console.error("Delete account failed:", err.message);
      setDeleteLoading(false);
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const dm = darkMode;
  const cardStyle = {
    background: dm ? "#1F2937" : "#fff",
    border: `1px solid ${dm ? "#374151" : "#E5E7EB"}`,
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "20px",
  };
  const labelStyle = {
    fontSize: "12px",
    color: dm ? "#9CA3AF" : "#6B7280",
    marginBottom: "4px",
    display: "block",
  };
  const valueStyle = {
    fontSize: "14px",
    color: dm ? "#F9FAFB" : "#111827",
    padding: "8px 0",
  };
  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    border: `1px solid ${dm ? "#374151" : "#D1D5DB"}`,
    borderRadius: "8px",
    fontSize: "14px",
    color: dm ? "#F9FAFB" : "#111827",
    background: dm ? "#374151" : "#fff",
    boxSizing: "border-box",
    outline: "none",
  };
  const sectionTitle = {
    fontSize: "16px",
    fontWeight: "600",
    color: dm ? "#F9FAFB" : "#111827",
    margin: "0 0 20px 0",
  };
  const rowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  };
  const rowLabel = { fontSize: "14px", color: dm ? "#E5E7EB" : "#374151" };

  const profileFields = [
    { label: "First Name", name: "firstName" },
    { label: "Last Name", name: "lastName" },
    { label: "Phone Number", name: "phone", type: "tel", wide: true },
    {
      label: "Email",
      name: "email",
      type: "email",
      wide: true,
      readOnly: true,
    },
    { label: "Purpose of Use", name: "purposeOfUse", wide: true },
    { label: "Institution", name: "institution", wide: true },
    { label: "Department", name: "department", wide: true },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: dm ? "#111827" : "#F9FAFB",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <Header
        onMenuToggle={() => setSidebarOpen(true)}
        title="Settings"
        darkMode={darkMode}
        onDarkModeToggle={() => handleDarkMode(!darkMode)}
      />

      <div className="flex pt-16">
        <Sidebar
          isOpen={sidebarOpen}
          userRole="student"
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 lg:ml-64" style={{ padding: "32px 16px" }}>
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: "700",
                marginBottom: "28px",
                color: dm ? "#F9FAFB" : "#111827",
              }}
            >
              Account Settings
            </h1>

            {pageLoading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 0",
                  color: dm ? "#9CA3AF" : "#6B7280",
                  fontSize: "14px",
                }}
              >
                Loading your profile...
              </div>
            )}

            {!pageLoading && pageError && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  marginBottom: "16px",
                  color: "#991B1B",
                  fontSize: "14px",
                }}
              >
                {pageError} —{" "}
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    color: "#2563EB",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {!pageLoading && !pageError && (
              <>
                {saveSuccess && (
                  <div
                    style={{
                      background: "#D1FAE5",
                      border: "1px solid #6EE7B7",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      marginBottom: "16px",
                      color: "#065F46",
                      fontSize: "14px",
                    }}
                  >
                    Profile saved successfully.
                  </div>
                )}

                {/* Avatar */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginBottom: "28px",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      background: "#DBEAFE",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "28px",
                      color: "#2563EB",
                      fontWeight: "600",
                      overflow: "hidden",
                    }}
                  >
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt="avatar"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : profile.firstName || profile.lastName ? (
                      `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`
                    ) : (
                      <IoPersonOutline size={36} color="#2563EB" />
                    )}
                  </div>
                  <button
                    onClick={() => navigate('/student/edit-profile')}
                    style={{
                      fontSize: "14px",
                      color: "#2563EB",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Edit Profile
                  </button>
                </div>

                {/* User Profile */}
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>User Profile</h2>

                  {/* Row 1: First Name + Last Name */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0 40px",
                      paddingBottom: "20px",
                      marginBottom: "20px",
                      borderBottom: `1px solid ${dm ? "#374151" : "#F3F4F6"}`,
                    }}
                  >
                    {[
                      { label: "First Name", value: profile.firstName },
                      { label: "Last Name", value: profile.lastName },
                    ].map((f) => (
                      <div key={f.label}>
                        <div
                          style={{
                            fontSize: "13px",
                            color: dm ? "#9CA3AF" : "#6B7280",
                            marginBottom: "4px",
                          }}
                        >
                          {f.label}
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: dm ? "#F9FAFB" : "#111827",
                          }}
                        >
                          {f.value || "—"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Row 2: Phone + Email */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0 40px",
                      paddingBottom: "20px",
                      marginBottom: "20px",
                      borderBottom: `1px solid ${dm ? "#374151" : "#F3F4F6"}`,
                    }}
                  >
                    {[
                      { label: "Phone", value: profile.phone },
                      { label: "Email Address", value: profile.email },
                    ].map((f) => (
                      <div key={f.label}>
                        <div
                          style={{
                            fontSize: "13px",
                            color: dm ? "#9CA3AF" : "#6B7280",
                            marginBottom: "4px",
                          }}
                        >
                          {f.label}
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: dm ? "#F9FAFB" : "#111827",
                          }}
                        >
                          {f.value || "—"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Row 3: Purpose of Use + Institution */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0 40px",
                      paddingBottom: "20px",
                      marginBottom: "20px",
                      borderBottom: `1px solid ${dm ? "#374151" : "#F3F4F6"}`,
                    }}
                  >
                    {[
                      { label: "Purpose of Use", value: profile.purposeOfUse },
                      { label: "Institution", value: profile.institution },
                    ].map((f) => (
                      <div key={f.label}>
                        <div
                          style={{
                            fontSize: "13px",
                            color: dm ? "#9CA3AF" : "#6B7280",
                            marginBottom: "4px",
                          }}
                        >
                          {f.label}
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: dm ? "#F9FAFB" : "#111827",
                          }}
                        >
                          {f.value || "—"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Row 4: Department */}
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: dm ? "#9CA3AF" : "#6B7280",
                        marginBottom: "4px",
                      }}
                    >
                      Department
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: dm ? "#F9FAFB" : "#111827",
                      }}
                    >
                      {profile.department || "—"}
                    </div>
                  </div>
                </div>

                {/* Account */}
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>Account</h2>
                  <div style={rowStyle}>
                    <span style={rowLabel}>Change Password</span>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      style={{
                        padding: "8px 20px",
                        borderRadius: "8px",
                        border: "none",
                        background: "#2563EB",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      Change
                    </button>
                  </div>
                  <div style={{ ...rowStyle, marginBottom: 0 }}>
                    <span style={rowLabel}>
                      Enable Two Factor Authentication
                    </span>
                    <Toggle
                      value={settings.twoFactorAuth}
                      onChange={() => handleToggle("twoFactorAuth")}
                      disabled={togglingKey === "twoFactorAuth"}
                    />
                  </div>
                </div>

                {/* Notifications */}
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>Notifications</h2>
                  {[
                    { key: "examReminder", label: "Exam Reminders" },
                    { key: "resultAlerts", label: "Result Alerts" },
                    { key: "systemUpdates", label: "System Updates" },
                  ].map(({ key, label }, i, arr) => (
                    <div
                      key={key}
                      style={{
                        ...rowStyle,
                        marginBottom: i === arr.length - 1 ? 0 : "16px",
                      }}
                    >
                      <span style={rowLabel}>{label}</span>
                      <Toggle
                        value={settings[key]}
                        onChange={() => handleToggle(key)}
                        disabled={togglingKey === key}
                      />
                    </div>
                  ))}
                </div>

                {/* Display Preferences */}
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>Display Preferences</h2>
                  <div
                    style={{
                      display: "flex",
                      borderRadius: "8px",
                      border: `1px solid ${dm ? "#374151" : "#D1D5DB"}`,
                      overflow: "hidden",
                      width: "fit-content",
                    }}
                  >
                    {[
                      ["Light Mode", false],
                      ["Dark Mode", true],
                    ].map(([label, val]) => (
                      <button
                        key={label}
                        onClick={() => handleDarkMode(val)}
                        style={{
                          padding: "8px 28px",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "14px",
                          background:
                            darkMode === val ? "#2563EB" : "transparent",
                          color:
                            darkMode === val
                              ? "#fff"
                              : dm
                                ? "#D1D5DB"
                                : "#374151",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Privacy & Permissions */}
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>Privacy & Permissions</h2>
                  {[
                    { key: "webcamAccess", label: "Webcam Access" },
                    { key: "microphoneAccess", label: "Microphone Access" },
                  ].map(({ key, label }, i, arr) => (
                    <div
                      key={key}
                      style={{
                        ...rowStyle,
                        marginBottom: i === arr.length - 1 ? 0 : "16px",
                      }}
                    >
                      <span style={rowLabel}>{label}</span>
                      <Toggle
                        value={settings[key]}
                        onChange={() => handleToggle(key)}
                        disabled={togglingKey === key}
                      />
                    </div>
                  ))}
                </div>

                {/* Support & Help */}
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>Support & Help</h2>
                  <div
                    style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
                  >
                    <button
                      onClick={() => navigate("/HelpCenter")}
                      style={{
                        padding: "10px 20px",
                        borderRadius: "8px",
                        border: `1px solid ${dm ? "#374151" : "#D1D5DB"}`,
                        background: "transparent",
                        color: dm ? "#E5E7EB" : "#374151",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      Visit Help Center
                    </button>
                    <button
                      onClick={() => navigate("/Student/ContactSupport")}
                      style={{
                        padding: "10px 20px",
                        borderRadius: "8px",
                        border: "none",
                        background: "#2563EB",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      Contact Support
                    </button>
                  </div>
                </div>

                {/* Delete Account */}
                <div style={{ paddingBottom: "40px" }}>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#DC2626",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      padding: 0,
                    }}
                  >
                    <IoTrashOutline size={16} />
                    Delete Account
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
          loading={deleteLoading}
        />
      )}
      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          userId={userId}
        />
      )}
     
    </div>
  );
};

export default StudentSettings;
