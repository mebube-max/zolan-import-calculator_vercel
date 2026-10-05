import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "China Import Calculator Nigeria · Landed Cost & Profit | Zolan", description: "Know what your China order will really cost before you pay. Calculate China-to-Nigeria landed cost, selling price, profit, break-even and cash recovery using your supplier and shipping quotes.", icons: { icon: "/mark.png" } };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}