import { Suspense } from "react";
import LoginPage from "./login-page";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-forest" />}>
      <LoginPage />
    </Suspense>
  );
}
