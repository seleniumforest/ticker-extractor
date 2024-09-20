"use client";
import "../globals.css";
import { QueryClient, QueryClientProvider } from "react-query";
import 'react-tabs/style/react-tabs.css';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Gate from "./gate";
import Binance from "./binance";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Infinity,
        },
    },
})

export default function App() {
    return (
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
    )
}