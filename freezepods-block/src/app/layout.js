import localFont from "next/font/local";
import "./globals.css";
import { ConnectedDevicesProvider } from "./context/ConnectedDevicesContext";
import { BlocklyProvider } from "./context/BlocklyContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Freezepods",
  description: "Freezepods with Micro:bits",
  icons: {
    icon: "/connect.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConnectedDevicesProvider>
          {" "}
          <BlocklyProvider>{children}</BlocklyProvider>
        </ConnectedDevicesProvider>
      </body>
    </html>
  );
}
