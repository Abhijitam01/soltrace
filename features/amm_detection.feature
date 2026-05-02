Feature: AMM type detection from program IDs
  As a developer
  I want the decoder to classify each transaction's AMM type
  So that the correct simulation path and UI messaging are used

  Background:
    Given the AMM registry contains:
      | Program ID                                   | Name             | Type             |
      | 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 | Raydium AMM v4   | constant-product |
      | CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C | Raydium CPSWAP   | constant-product |
      | 9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP | Orca v1          | constant-product |
      | JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4  | Jupiter v6       | aggregator       |
      | whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc  | Orca Whirlpool   | clmm             |
      | CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK | Raydium CLMM     | clmm             |

  Scenario Outline: Known program IDs map to the correct AMM type
    When detectAmmType is called with program IDs containing "<programId>"
    Then the result is "<ammType>"

    Examples:
      | programId                                    | ammType          |
      | 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 | constant-product |
      | CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C | constant-product |
      | 9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP | constant-product |
      | JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4  | aggregator       |
      | whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc  | clmm             |
      | CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK | clmm             |

  Scenario: Unknown program ID maps to "unknown" AMM type
    When detectAmmType is called with a program ID not in the registry
    Then the result is "unknown"

  Scenario: constant-product takes priority over aggregator when both are present
    When detectAmmType is called with program IDs containing both Raydium AMM v4 and Jupiter v6
    Then the result is "constant-product"

  Scenario: CLMM is detected when no constant-product program is present
    When detectAmmType is called with only Orca Whirlpool in the program IDs
    Then the result is "clmm"

  Scenario: SOL-only transfer with no AMM programs
    When detectAmmType is called with only the System Program ID
    Then the result is "unknown"
