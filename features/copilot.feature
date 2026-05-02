Feature: Copilot — analyze an unsigned transaction before signing
  As a user about to sign a transaction in my Solana wallet
  I want to paste the raw base64 transaction bytes and see a risk analysis
  So that I can decide whether to proceed with signing

  Background:
    Given the /copilot page is loaded
    And the /api/decode POST endpoint is available

  Scenario: Analyze a valid base64-encoded unsigned Raydium transaction
    When I paste a valid base64-encoded unsigned Raydium transaction
    And I click "Analyze before signing"
    Then the response is received within 5 seconds
    And a RiskBadge is displayed showing the risk score
    And a human-readable summary is displayed
    And the Account Changes panel shows at least one "approval" type diff

  Scenario: Error shown for empty textarea submission
    When I click "Analyze before signing" without pasting anything
    Then the inline error "Paste a base64-encoded transaction" is shown
    And no API request is made

  Scenario: Error shown for invalid base64 input
    When I paste "not-valid-base64!!!" into the textarea
    And I click "Analyze before signing"
    Then the response status is 400
    And the inline error displays the server error message

  Scenario: Error shown for base64 bytes that are too short to be a transaction
    When I paste fewer than 64 bytes of valid base64
    And I click "Analyze before signing"
    Then the inline error is shown

  Scenario: Risk score reflects unknown programs
    Given a raw transaction that calls an unknown program (not in the AMM registry)
    When I submit it to POST /api/decode
    Then the riskScore is at least 45

  Scenario: Risk score is elevated for unknown program with token approval
    Given a raw transaction that calls an unknown program and also the Token Program
    When I submit it to POST /api/decode
    Then the riskScore is at least 65

  Scenario: Known Raydium-only transaction has low risk score
    Given a raw transaction that calls only Raydium AMM v4 and the Token Program
    When I submit it to POST /api/decode
    Then the riskScore is at most 10

  Scenario: Summary reflects the programs detected
    Given a raw transaction calling Raydium AMM v4
    When I submit it to POST /api/decode
    Then the summary contains "Raydium AMM v4"

  Scenario: Clearing the textarea after an error removes the error message
    Given the inline error is visible
    When I clear the textarea and start typing
    Then the error message disappears

  Scenario: Network failure shows a user-friendly error
    Given the /api/decode endpoint returns a network error
    When I click "Analyze before signing"
    Then the message "Network error — please try again" is shown
