import "./globals.css";
import "./account.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/components/Cart";
import { CartDrawer } from "@/components/CartDrawer";

export const metadata = {
  title: "Nella Premium — швейный бренд",
  description: "Женская одежда от бренда Nella Premium."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <CartProvider>
          <Header />
          <CartDrawer />
          {children}
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
