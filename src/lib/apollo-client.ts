'use client'

import { ApolloClient, InMemoryCache, createHttpLink, from, NormalizedCacheObject } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8080/graphql',
})

const authLink = setContext(
  (_: unknown, { headers }: { headers?: Record<string, string> }) => ({
    headers: {
      ...headers,
      authorization:
        typeof window !== 'undefined' ? localStorage.getItem('auth') ?? '' : '',
    },
  })
);

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) console.error('[GraphQL error]:', err)
  }
  if (networkError) console.error('[Network error]:', networkError)
});

export const apolloClient: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Cell: {
        keyFields: ['matrixKey', 'row', 'col']
      },
      Matrix: {
        keyFields: ['stationName', 'name']
      },
      Station: {
        keyFields: ['name']
      },
      CellStage: {
        keyFields: ['stage']
      }
    }
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network'
    },
    query: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-first'
    }
  }
})

export default apolloClient