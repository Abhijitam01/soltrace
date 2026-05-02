Feature: Simulate price scenarios for constant-product AMM swaps
  As a user viewing a Raydium or Orca v1 swap
  I want to drag a price multiplier slider
  So that I can see what my outcome would have been at different price levels

  Background:
    Given a decoded Raydium AMM v4 swap with known inbound and outbound token diffs

  Scenario: Slider is shown only for constant-product AMM transactions
    Given the decoded transaction has ammType "constant-product"
    Then the "Price Scenario" slider panel is visible on the simulate page

  Scenario: Slider is hidden for aggregator transactions
    Given the decoded transaction has ammType "aggregator"
    Then the "Price Scenario" slider panel is not visible
    And the message "Multi-pool aggregator — price simulation unavailable" is shown

  Scenario: Slider is hidden for CLMM transactions
    Given the decoded transaction has ammType "clmm"
    Then the "Price Scenario" slider panel is not visible
    And the message "Concentrated liquidity — price simulation unavailable" is shown

  Scenario: Simulate at 1x multiplier reproduces original output
    When I call POST /api/simulate with multiplier 1.0 and the original diffs
    Then the response pnlDelta is 0
    And the simulated output token amount equals the original output token amount

  Scenario: Simulate at 2x multiplier approximately doubles input and increases output
    When I call POST /api/simulate with multiplier 2.0
    Then the outbound token delta magnitude is approximately 2x the original
    And the inbound token delta is greater than the original inbound delta
    And the pnlDelta is positive

  Scenario: Simulate at 0.5x multiplier halves input and reduces output
    When I call POST /api/simulate with multiplier 0.5
    Then the outbound token delta magnitude is approximately 0.5x the original
    And the inbound token delta is less than the original inbound delta
    And the pnlDelta is negative

  Scenario: Reject multiplier below minimum
    When I call POST /api/simulate with multiplier 0.09
    Then the response status is 400
    And the response "code" is "INVALID_MULTIPLIER"

  Scenario: Reject multiplier above maximum
    When I call POST /api/simulate with multiplier 3.01
    Then the response status is 400
    And the response "code" is "INVALID_MULTIPLIER"

  Scenario: Non-swap diffs return zero pnlDelta
    Given diffs contain only SOL transfers with no token entries
    When I call POST /api/simulate with multiplier 2.0
    Then the response pnlDelta is 0
    And the diffs array is unchanged

  Scenario: CLMM ammType returns clmmUnavailable flag
    When I call POST /api/simulate with ammType "clmm"
    Then the response contains "clmmUnavailable": true

  Scenario: Aggregator ammType returns aggregatorUnavailable flag
    When I call POST /api/simulate with ammType "aggregator"
    Then the response contains "aggregatorUnavailable": true

  Scenario Outline: Slider boundary multipliers are accepted
    When I call POST /api/simulate with multiplier <multiplier>
    Then the response status is 200

    Examples:
      | multiplier |
      | 0.1        |
      | 3.0        |
      | 1.0        |
