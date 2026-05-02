Feature: Recent analyses feed on the home page
  As a returning user
  I want to see recently decoded transactions on the home page
  So that I can quickly revisit past analyses

  Background:
    Given the Turso database is configured and reachable

  Scenario: Home page shows up to 10 recent analyses when available
    Given there are 15 analyses in the database
    When I load the home page
    Then at most 10 analysis entries are displayed in the recent feed
    And each entry shows a truncated signature, a summary, and a relative date

  Scenario: Clicking a recent analysis navigates to the simulate page
    Given there is at least one analysis in the recent feed
    When I click an analysis entry
    Then I am taken to "/simulate?sig=<that_analysis_signature>"

  Scenario: Recent feed is hidden when the database has no entries
    Given the database is empty
    When I load the home page
    Then no recent feed section is rendered

  Scenario: Home page remains functional when the database is unreachable
    Given the Turso database is unavailable
    When I load the home page
    Then the page renders without the recent feed
    And no error is shown to the user
    And the signature input form is still present

  Scenario: A freshly decoded transaction appears in the recent feed
    Given the database starts empty
    When I decode a valid transaction
    And I reload the home page
    Then the decoded transaction appears in the recent feed with its summary
