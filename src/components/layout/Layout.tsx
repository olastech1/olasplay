import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background bg-noise">
      <Header />
      <main className="pt-16 md:pt-20">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
