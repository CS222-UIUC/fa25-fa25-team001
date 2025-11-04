import type { Metadata } from "next";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "User Profile - Media Review",
  description: "Manage your media review profile",
};

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <Header />
      {children}
    </div>
  );
}