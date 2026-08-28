import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";
import "./globals.css";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Examly | Fun, Colorful Study for IGCSE, A Levels & AP",
  description:
    "Notes, flashcards, quizzes, and a huge past papers library made fun for secondary and high school students - IGCSE, AS/A Levels, AP, SAT, IELTS and HSK.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${baloo.variable} ${nunito.variable} bg-background text-ink antialiased`}
      >
        <SupabaseProvider>
          <div className="min-h-screen bg-gradient-to-br from-[#fff8ec] via-[#fdf2ff] to-[#eef2ff] dark:from-[#150f28] dark:via-[#1a1330] dark:to-[#150f28]">
            {children}
          </div>
        </SupabaseProvider>
      </body>
    </html>
  );
}

