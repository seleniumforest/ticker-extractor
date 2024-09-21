"use client";
import "../globals.css";
import { QueryClient, QueryClientProvider } from "react-query";
import 'react-tabs/style/react-tabs.css';
import { Tab, Tabs, TabList, TabPanel, TabPanelProps } from 'react-tabs';
import Gate from "./gate";
import Binance from "./binance";
import { useEffect, useState } from "react";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Infinity,
        },
    },
})

export default function MainPage() {
    const [tabIndex, setTabIndex] = useState(0);

    return (
        <QueryClientProvider client={queryClient}>
            <Tabs selectedIndex={tabIndex} onSelect={(index) => setTabIndex(index)}>
                <TabList>
                    <Tab>Binance</Tab>
                    <Tab>Gate</Tab>
                </TabList>
                <LazyTabPanel>
                    <Binance />
                </LazyTabPanel>
                <LazyTabPanel>
                    <Gate />
                </LazyTabPanel>
            </Tabs>
        </QueryClientProvider>
    )
}

const LazyTabPanel = (props: TabPanelProps) => {
    const [initialized, setInitialized] = useState(false);
    useEffect(() => {
        if (props.selected && !initialized) {
            setInitialized(true);
        }
    }, [props.selected, initialized]);

    return <TabPanel forceRender={initialized} {...props} />;
};
LazyTabPanel.tabsRole = 'TabPanel';