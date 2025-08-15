import { gql } from '@apollo/client'

// Cell-level queries
export const PULL_CELL = gql`
  query PullCell($stationName: String!, $matrixName: String!, $row: Int!, $col: Int!, $includeOntologies: Boolean = false) {
    pullCell(stationName: $stationName, matrixName: $matrixName, row: $row, col: $col, includeOntologies: $includeOntologies) {
      matrixKey
      row
      col
      labels {
        rowLabel
        colLabel
      }
      stages {
        stage
        value
        modelId
        promptHash
        latencyMs
        warnings
        meta
        createdAt
      }
      ontologies @include(if: $includeOntologies) {
        curie
        label
        scope
      }
    }
  }
`

export const UPSERT_CELL_STAGE = gql`
  mutation UpsertCellStage(
    $stationName: String!
    $matrixName: String!
    $row: Int!
    $col: Int!
    $stage: String!
    $value: String!
    $modelId: String
    $promptHash: String
    $labels: String
    $meta: String
  ) {
    upsertCellStage(
      stationName: $stationName
      matrixName: $matrixName
      row: $row
      col: $col
      stage: $stage
      value: $value
      modelId: $modelId
      promptHash: $promptHash
      labels: $labels
      meta: $meta
    ) {
      success
      deduped
      version
      contentHash
    }
  }
`

// Matrix and Station queries
export const GET_STATIONS = gql`
  query GetStations {
    stations {
      name
      index
      createdAt
      matrices {
        name
        title
        matrixKey
        createdAt
        axes {
          kind
          labels {
            index
            value
          }
        }
      }
    }
  }
`

export const GET_MATRIX_OVERVIEW = gql`
  query GetMatrixOverview($stationName: String!, $matrixName: String!) {
    matrix(stationName: $stationName, matrixName: $matrixName) {
      name
      title
      matrixKey
      stationName
      createdAt
      axes {
        kind
        labels {
          index
          value
        }
      }
      cells {
        row
        col
        labels {
          rowLabel
          colLabel
        }
        latestStage {
          stage
          value
          modelId
          createdAt
          warnings
        }
      }
    }
  }
`

// Phase-2 Document Synthesis queries
export const GET_DOCUMENT_SYNTHESIS_MATRICES = gql`
  query GetDocumentSynthesisMatrices {
    station(name: "Document Synthesis") {
      name
      matrices {
        name
        title
        matrixKey
        cells {
          row
          col
          labels {
            rowLabel
            colLabel
          }
          latestStage {
            stage
            value
            meta
            createdAt
          }
        }
      }
    }
  }
`

export const GET_DS_MATRIX = gql`
  query GetDSMatrix($rows: [Int!], $cols: [Int!]) {
    matrix(stationName: "Document Synthesis", matrixName: "DS") {
      name
      title
      matrixKey
      cells(where: { 
        AND: [
          { row: { in: $rows } }
          { col: { in: $cols } }
        ]
      }) {
        row
        col
        labels {
          rowLabel
          colLabel
        }
        stages {
          stage
          value
          meta
          createdAt
        }
      }
    }
  }
`

// UFO Claims and ontology queries
export const GET_UFO_CLAIMS = gql`
  query GetUfoClaims($stationName: String, $matrixName: String) {
    ufoClaims(where: {
      stationName: $stationName
      matrixName: $matrixName
    }) {
      id
      stationName
      matrixName
      row
      col
      claimType
      claimText
      evidence
      confidence
      status
      reviewerId
      createdAt
      updatedAt
    }
  }
`

export const CREATE_UFO_CLAIM = gql`
  mutation CreateUfoClaim(
    $stationName: String!
    $matrixName: String!
    $row: Int!
    $col: Int!
    $claimType: String!
    $claimText: String!
    $evidence: String
    $confidence: Float
  ) {
    createUfoClaim(
      stationName: $stationName
      matrixName: $matrixName
      row: $row
      col: $col
      claimType: $claimType
      claimText: $claimText
      evidence: $evidence
      confidence: $confidence
    ) {
      id
      status
      createdAt
    }
  }
`

// Pipeline status and monitoring
export const GET_PIPELINE_STATUS = gql`
  query GetPipelineStatus {
    pipelineStatus {
      isRunning
      currentJob {
        id
        command
        startedAt
        status
      }
      recentJobs {
        id
        command
        status
        startedAt
        endedAt
        exitCode
      }
    }
  }
`

// Health and system queries
export const HEALTH_CHECK = gql`
  query HealthCheck {
    health {
      status
      timestamp
      neo4j {
        connected
        version
      }
      services {
        graphql
        neo4j
        openai
      }
    }
  }
`

// Search and discovery
export const SEARCH_CELLS = gql`
  query SearchCells($query: String!, $stationName: String, $matrixName: String, $stage: String) {
    searchCells(
      query: $query
      stationName: $stationName
      matrixName: $matrixName
      stage: $stage
    ) {
      matrixKey
      row
      col
      labels {
        rowLabel
        colLabel
      }
      latestStage {
        stage
        value
        createdAt
      }
      relevanceScore
    }
  }
`

// Ontology queries
export const GET_ONTOLOGIES = gql`
  query GetOntologies($scope: String) {
    ontologies(where: { scope: $scope }) {
      curie
      label
      scope
      description
      bindings {
        stationName
        matrixName
        axisKind
      }
    }
  }
`