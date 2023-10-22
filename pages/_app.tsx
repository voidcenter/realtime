import { AppContextProvider } from '@/context/AppContext';
import './globals.css';
import { AppProps } from 'next/app';
import dynamic from 'next/dynamic';

function App({ Component, pageProps }: AppProps) {
    return (
        <AppContextProvider>
            <Component {...pageProps} />
        </AppContextProvider>
    );
}

export default dynamic(() => Promise.resolve(App), {
    ssr: false,
});

