import { AppContextProvider } from '@/context/AppContext';
import './globals.css';
import { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
    cache: new InMemoryCache(),
    uri: "https://api.studio.thegraph.com/query/960/testn/version/latest"
  });


function App({ Component, pageProps }: AppProps) {
    return (
        <ApolloProvider client={client}>
            <AppContextProvider>
                <Component {...pageProps} />
            </AppContextProvider>
        </ApolloProvider>
    );
}

export default dynamic(() => Promise.resolve(App), {
    ssr: false,
});

