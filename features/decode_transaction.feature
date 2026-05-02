Feature: Decode a confirmed Solana transaction
  As a user
  I want to paste a transaction signature on the home page
  So that I can see account balance changes and a human-readable summary

  Background:
    Given the decode API is available

  Scenario: Decode a valid Raydium AMM v4 swap signature
    When I submit the signature "<valid_raydium_sig>"
    Then the response status is 200
    And the response contains a non-empty "summary" field
    And the response contains a "diffs" array with at least one entry
    And each diff has fields: owner, mint, preBalance, postBalance, delta, type
    And the "ammType" field is "constant-product"
    And the "riskScore" field is an integer between 0 and 100

  Scenario: Decode a valid Jupiter v6 aggregated route signature
    When I submit the signature "<valid_jupiter_sig>"
    Then the response status is 200
    And the "ammType" field is "aggregator"
    And the "summary" includes "swap"

  Scenario: Reject an invalid signature format
    When I submit the signature "not-a-real-sig"
    Then the response status is 400
    And the response "code" is "INVALID_SIG"

  Scenario: Return 404 for a well-formed but non-existent signature
    When I submit the signature "<nonexistent_valid_sig>"
    Then the response status is 404
    And the response "code" is "NOT_FOUND"

  Scenario: Return cached result on second request for the same signature
    Given the signature "<valid_raydium_sig>" has been decoded once
    When I submit the signature "<valid_raydium_sig>" again
    Then the response status is 200
    And the response is identical to the first decode

  Scenario: Navigate from home page to simulate page
    Given I am on the home page
    When I paste a valid signature into the input field and submit
    Then I am redirected to "/simulate?sig=<that_signature>"
    And the page shows the transaction summary

  Scenario Outline: Signature validation boundary cases
    When I submit the signature "<sig>"
    Then the response status is <status>
    And the response "code" is "<code>"

    Examples:
      | sig                                                                        | status | code         |
      | (empty string)                                                             | 400    | INVALID_SIG  |
      | AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA | 400    | INVALID_SIG  |
      | 3PWxBuY7GNm9j3kESVyu2udR5dqomegYHWHwHvftgkM7ST9ZnuEstWdxRJbfhNUiM7twQpCc5yyzKfNtfytvxjdj | 200    | -            |
