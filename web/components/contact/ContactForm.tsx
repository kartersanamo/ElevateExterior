"use client";

import { Button } from "@/components/ui/Button";
import { contactSchema, type ContactFormData } from "@/lib/validators/contact";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

export function ContactForm() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      message: "",
      website: "",
    },
  });

  const messageLength = watch("message")?.length ?? 0;
  const inputClass = "form-input";

  const onSubmit = async (data: ContactFormData) => {
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(
          json.error ?? "Something went wrong. Please try again."
        );
        return;
      }

      setStatus("success");
      reset();
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again or call us directly.");
    }
  };

  if (status === "success") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-teal/30 bg-mint p-6">
        <CheckCircle className="shrink-0 text-teal" size={24} aria-hidden />
        <div>
          <p className="font-semibold text-forest">Message sent!</p>
          <p className="mt-1 text-sm text-slate/70">
            We&apos;ll get back to you within 24 hours.
          </p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-3 text-sm font-semibold text-teal hover:underline"
          >
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <input
        type="text"
        {...register("website")}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-1 block text-sm font-semibold">
            First name
          </label>
          <input
            id="firstName"
            {...register("firstName")}
            className={inputClass}
            autoComplete="given-name"
          />
          {errors.firstName ? (
            <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="lastName" className="mb-1 block text-sm font-semibold">
            Last name
          </label>
          <input
            id="lastName"
            {...register("lastName")}
            className={inputClass}
            autoComplete="family-name"
          />
          {errors.lastName ? (
            <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-semibold">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          className={inputClass}
          autoComplete="email"
        />
        {errors.email ? (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-semibold">
          Phone <span className="font-normal text-slate/50">(optional)</span>
        </label>
        <input
          id="phone"
          type="tel"
          {...register("phone")}
          className={inputClass}
          autoComplete="tel"
        />
        {errors.phone ? (
          <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-semibold">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          {...register("message")}
          className={inputClass}
          placeholder="Tell us about your property and what you'd like cleaned…"
        />
        <div className="mt-1 flex justify-between text-xs text-slate/50">
          {errors.message ? (
            <p className="text-red-600">{errors.message.message}</p>
          ) : (
            <span />
          )}
          <span>{messageLength}/2000</span>
        </div>
      </div>

      {status === "error" ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle size={18} className="shrink-0" aria-hidden />
          {errorMessage}
        </div>
      ) : null}

      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? (
          <>
            <Loader2 className="mr-2 animate-spin" size={18} aria-hidden />
            Sending…
          </>
        ) : (
          "Send message"
        )}
      </Button>
    </form>
  );
}
