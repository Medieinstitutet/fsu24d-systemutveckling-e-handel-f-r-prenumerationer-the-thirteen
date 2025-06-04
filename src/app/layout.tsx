import SessionProviderWrapper from "../components/SessionProviderWrapper";
<<<<<<< HEAD
import "./globals.css";
=======
import './globals.css';

>>>>>>> main

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
