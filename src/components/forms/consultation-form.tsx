"use client";

import { useState } from "react";
import { CheckCircle, ChevronDown, Mail, MessageCircle } from "lucide-react";

const DESTINATIONS = [
  { slug: "south-korea", name: "South Korea" },
  { slug: "australia", name: "Australia" },
  { slug: "canada", name: "Canada" },
  { slug: "uk", name: "United Kingdom" },
  { slug: "usa", name: "United States" },
  { slug: "new-zealand", name: "New Zealand" },
  { slug: "germany", name: "Germany" },
  { slug: "japan", name: "Japan" },
];

const RECIPIENT_EMAIL = "gurumantraconsultancy39@gmail.com";

interface ConsultationFormProps {
  variant?: "home" | "booking";
}

interface SubmitResult {
  mode: "smtp" | "resend" | "mailto_fallback";
  recipient: string;
  mailtoUrl?: string;
}

export default function ConsultationForm({ variant = "home" }: ConsultationFormProps) {
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    destination: "",
    message: "",
  });

  const isBooking = variant === "booking";

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: isBooking ? "0.7rem 1rem" : "0.65rem 1rem",
    borderRadius: "0.75rem",
    border: "1px solid var(--border)",
    background: "var(--background)",
    color: "var(--foreground)",
    fontSize: "0.875rem",
    outline: "none",
    boxSizing: "border-box",
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          source: isBooking ? "book-consultation" : "home",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Failed to submit your request. Please try again.");
        return;
      }

      setResult({
        mode: data.mode,
        recipient: data.recipient || RECIPIENT_EMAIL,
        mailtoUrl: data.mailtoUrl,
      });
    } catch {
      setError("Network error while sending your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setResult(null);
    setError(null);
    setForm({ name: "", email: "", phone: "", destination: "", message: "" });
  }

  if (result) {
    const isDirectDelivery = result.mode === "smtp" || result.mode === "resend";

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: isBooking ? "3.5rem 0" : "3rem 0",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: isBooking ? 60 : 56,
            height: isBooking ? 60 : 56,
            borderRadius: "50%",
            background: "#dcfce7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: isBooking ? "1.25rem" : "1rem",
          }}
        >
          <CheckCircle style={{ width: isBooking ? 30 : 28, height: isBooking ? 30 : 28, color: "#16a34a" }} />
        </div>
        <h3
          style={{
            fontSize: isBooking ? "1.2rem" : "1.1rem",
            fontWeight: 800,
            color: "var(--foreground)",
            marginBottom: "0.5rem",
          }}
        >
          Thank You!
        </h3>
        <p
          style={{
            fontSize: isBooking ? "0.9rem" : "0.875rem",
            color: "var(--muted-foreground)",
            maxWidth: "34ch",
            lineHeight: 1.6,
            marginBottom: "1.25rem",
          }}
        >
          {isDirectDelivery
            ? "Your consultation inquiry has been sent! Our counselor will contact you within 24 hours."
            : `Your consultation details are ready to send directly to ${result.recipient}.`}
        </p>

        {!isDirectDelivery && result.mailtoUrl && (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <a
              href={result.mailtoUrl}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.25rem",
                borderRadius: "0.75rem",
                background: "var(--primary)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.85rem",
                textDecoration: "none",
              }}
            >
              <Mail style={{ width: 15, height: 15 }} /> Send Email Now
            </a>
            <a
              href={`https://wa.me/9779808531098?text=${encodeURIComponent(
                `Hi Gurumantra! Name: ${form.name}, Email: ${form.email}, Phone: ${form.phone}, Destination: ${form.destination || "Not decided"}. ${form.message}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.25rem",
                borderRadius: "0.75rem",
                background: "#16a34a",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.85rem",
                textDecoration: "none",
              }}
            >
              <MessageCircle style={{ width: 15, height: 15 }} /> Send via WhatsApp
            </a>
          </div>
        )}

        <button
          type="button"
          onClick={resetForm}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--primary)",
            fontSize: "0.8rem",
            fontWeight: 700,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Submit another inquiry
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: isBooking ? "1.1rem" : "1rem" }}
    >
      {error && (
        <div
          role="alert"
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            background: "rgba(211, 47, 47, 0.1)",
            border: "1px solid rgba(211, 47, 47, 0.3)",
            color: "#D32F2F",
            fontSize: "0.82rem",
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
        className={isBooking ? "form-2col" : "form-row"}
      >
        <div>
          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.375rem" }}>
            Full Name *
          </label>
          <input
            required
            type="text"
            placeholder="Your full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.375rem" }}>
            Email Address *
          </label>
          <input
            required
            type="email"
            placeholder="you@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={inputStyle}
          />
        </div>
      </div>

      {isBooking ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="form-2col">
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.375rem" }}>
              Phone Number *
            </label>
            <input
              required
              type="tel"
              placeholder="+977 98XXXXXXXX"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.375rem" }}>
              Preferred Destination
            </label>
            <div style={{ position: "relative" }}>
              <select
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                style={{ ...inputStyle, appearance: "none" as const }}
              >
                <option value="">Select destination…</option>
                {DESTINATIONS.map((d) => (
                  <option key={d.slug} value={d.name}>
                    {d.name}
                  </option>
                ))}
                <option value="Not decided">Not decided yet</option>
              </select>
              <ChevronDown
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 15,
                  height: 15,
                  color: "var(--muted-foreground)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.375rem" }}>
              Phone Number *
            </label>
            <input
              required
              type="tel"
              placeholder="+977 98XXXXXXXX"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.375rem" }}>
              Preferred Destination
            </label>
            <div style={{ position: "relative" }}>
              <select
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                style={{ ...inputStyle, appearance: "none" as const }}
              >
                <option value="">Select destination...</option>
                {DESTINATIONS.map((d) => (
                  <option key={d.slug} value={d.name}>
                    {d.name}
                  </option>
                ))}
                <option value="Not decided">Not decided yet</option>
              </select>
              <ChevronDown
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 15,
                  height: 15,
                  color: "var(--muted-foreground)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>
        </>
      )}

      <div>
        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.375rem" }}>
          Your Message
        </label>
        <textarea
          rows={isBooking ? 4 : 3}
          placeholder={
            isBooking
              ? "Tell us about your goals, qualifications, preferred budget…"
              : "Tell us about your goals, qualifications, budget..."
          }
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          style={{ ...inputStyle, resize: "none" }}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        style={{
          width: "100%",
          padding: isBooking ? "0.95rem" : "0.9rem",
          borderRadius: "0.875rem",
          background: "var(--primary)",
          color: "#fff",
          fontWeight: 700,
          fontSize: isBooking ? "0.95rem" : "0.9rem",
          border: "none",
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting ? 0.75 : 1,
          boxShadow: "0 4px 16px rgba(21,101,192,0.30)",
        }}
      >
        {submitting ? "Sending..." : "Get Free Consultation →"}
      </button>

      <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", textAlign: "center" }}>
        100% free. No obligation. We respond within 24 hours.
      </p>
    </form>
  );
}
