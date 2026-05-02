Feature: AI-powered transaction explanation
  As a user on the simulate page
  I want an AI-generated risk score and plain-English summary
  So that I can understand what the transaction did without reading raw account diffs

  Background:
    Given the /api/explain endpoint is available
    And a valid DecodedTransaction object is provided

  Scenario: Explain endpoint returns a streaming data response
    When I POST a DecodedTransaction to /api/explain
    Then the response streams data
    And the accumulated JSON contains a "riskScore" integer field
    And the accumulated JSON contains a "summary" string field

  Scenario: riskScore is bounded to 0-100
    When I POST a DecodedTransaction to /api/explain
    Then the streamed riskScore is between 0 and 100 inclusive

  Scenario: Explanation is returned for a Raydium swap
    Given a DecodedTransaction with ammType "constant-product"
    When I POST it to /api/explain
    Then the summary describes a routine swap operation
    And the riskScore is below 26

  Scenario: Explanation is returned for an unknown program transaction
    Given a DecodedTransaction with an unrecognized programId
    When I POST it to /api/explain
    Then the riskScore is at least 51

  Scenario: Missing decodedTx body returns 400
    When I POST an empty body to /api/explain
    Then the response status is 400
    And the response contains an "error" field

  Scenario: Invalid JSON body returns 400
    When I POST malformed JSON to /api/explain
    Then the response status is 400

  Scenario: Streaming panel shows a loading state while explain request is in-flight
    Given the simulate page has loaded a decoded transaction
    When the /api/explain request is pending
    Then the StreamingPanel shows a loading indicator
    And the AccountDiffTable is already populated with the decoded diffs

  Scenario: Streaming panel re-fetches explanation when slider is moved after debounce
    Given the simulate page has displayed an AI explanation
    When I move the price slider and wait 300ms after stopping
    Then the StreamingPanel initiates a new /api/explain request
