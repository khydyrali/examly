"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudentFrqRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/student/practice?mode=frq");
  }, [router]);
  return null;
}
