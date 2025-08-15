'use client'

import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8080/graphql',
})

const authLink = setContext((_, { headers }) => {
  // Add any auth headers if needed
  return {
    headers: {
      ...headers,
      // Add authorization header if using tokens
      // authorization: token ? `Bearer ${token}` : "",
    }
  }
})

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(
        `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    )
  }

  if (networkError) {
    console.error(`Network error: ${networkError}`)
    
    // If GraphQL service is down, fallback to REST API
    if (networkError.message.includes('fetch')) {
      console.warn('GraphQL service unavailable, falling back to REST API')
    }
  }
})

const apolloClient = new ApolloClient({
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