"use client";

export async function postAiJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data?.error === "string" ? data.error : "Request failed. Please try again."
    );
  }

  return data as T;
}
