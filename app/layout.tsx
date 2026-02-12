import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter for that premium look
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Dietary AI Compliance Dashboard",
    description: "AI-powered diet template auditing system",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
