"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudentQuizRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/student/practice?mode=mcq");
  }, [router]);
  return null;
}
