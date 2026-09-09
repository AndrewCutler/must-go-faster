/*
 * CODEX-GENERATED: the contents of this file were fully constructed by a Codex agent and not a human.
 */

package game

import (
	"testing"
	"time"
)

func TestRandomComputerDelay(t *testing.T) {
	for _, tc := range []struct {
		name      string
		moves     int
		remaining float64
		min, max  time.Duration
	}{
		{"forced move", 1, 60, 100 * time.Millisecond, 500 * time.Millisecond},
		{"forced move short clock", 1, 0.05, 50 * time.Millisecond, 50 * time.Millisecond},
		{"two choices", 2, 60, 500 * time.Millisecond, 550 * time.Millisecond},
		{"few choices", 10, 60, 500 * time.Millisecond, 950 * time.Millisecond},
		{"many choices", 20, 60, 500 * time.Millisecond, 1450 * time.Millisecond},
		{"cap", 41, 60, 500 * time.Millisecond, 2500 * time.Millisecond},
		{"above cap", 100, 60, 500 * time.Millisecond, 2500 * time.Millisecond},
		{"short clock", 100, 0.1, 100 * time.Millisecond, 100 * time.Millisecond},
		{"no choices", 0, 60, 500 * time.Millisecond, 500 * time.Millisecond},
	} {
		t.Run(tc.name, func(t *testing.T) {
			for i := 0; i < 1000; i++ {
				delay := randomComputerDelay(tc.remaining, tc.moves)
				if delay < tc.min || delay > tc.max {
					t.Fatalf("delay %v outside [%v, %v]", delay, tc.min, tc.max)
				}
			}
		})
	}
}
