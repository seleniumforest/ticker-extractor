"use client";
import localFont from "next/font/local";
import "./globals.css";
import { QueryClient, QueryClientProvider } from "react-query";
import 'react-tabs/style/react-tabs.css';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Gate from "./gate";
import Binance from "./binance";

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
})

export default function RootLayout() {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <QueryClientProvider client={queryClient}>
          <Tabs>
            <TabList>
              <Tab>Gate</Tab>
              <Tab>Binance</Tab>
            </TabList>

            <TabPanel>
              <Gate />
            </TabPanel>
            <TabPanel>
              <Binance />
            </TabPanel>
          </Tabs>
        </QueryClientProvider>
      </body>
    </html>
  );
}
