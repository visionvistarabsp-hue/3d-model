import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Not Found",
};

export default function NotFound() {
  return (
    <html lang="en">
      <body className="flex h-screen items-center justify-center bg-[#0b0d12] text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="mt-2 text-white/60">Page not found</p>
        </div>
      </body>
    </html>
  );
}