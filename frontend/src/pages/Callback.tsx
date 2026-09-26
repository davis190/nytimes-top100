import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { handleCallback } from "../lib/auth";

export default function Callback({ onDone }: { onDone: () => void }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("code");
    if (!code) {
      setError("Missing authorization code");
      return;
    }
    handleCallback(code)
      .then(() => {
        onDone();
        navigate("/", { replace: true });
      })
      .catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <p>Sign in failed: {error}</p>;
  return <p>Signing you in…</p>;
}
