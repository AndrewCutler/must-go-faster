/*
 * CODEX-GENERATED: the contents of this file were fully constructed by a Codex agent and not a human.
 */

package game

import (
	"math"
	"testing"
	"time"

	"github.com/notnil/chess"
)

func TestHandlePremoveMessagePreservesPremoverClock(t *testing.T) {
	withServerWorkingDir(t)

	hub := NewHub()
	white := newTestPlayer()
	black := newTestPlayer()

	game := newTestGame(t, "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b - - 0 1")
	session := &Session{
		SessionId: "session-1",
		Game:      game,
		White:     white,
		Black:     black,
	}

	white.SessionId = session.SessionId
	black.SessionId = session.SessionId
	white.Hub = hub
	black.Hub = hub
	white.Clock = Clock{
		TimeLeft:  10.5,
		TimeStamp: time.Now(),
	}
	black.Clock = Clock{
		TimeLeft:  10.5,
		TimeStamp: time.Now().Add(-2 * time.Second),
		IsRunning: true,
	}

	hub.InProgressSessions[session.SessionId] = session

	handleMoveMessage(
		Message{
			Payload: MoveToServer{
				Move: Move{
					From: "e7",
					To:   "e5",
				},
			},
		},
		session,
	)

	readWireMessage(t, white.WriteChan)

	whiteBefore := session.White.Clock.TimeLeft

	handlePremoveMessage(
		Message{
			Payload: PremoveToServer{
				Premove: Move{
					From: "g1",
					To:   "f3",
				},
			},
		},
		session,
	)

	if diff := math.Abs(session.White.Clock.TimeLeft - whiteBefore); diff > 0.0001 {
		t.Fatalf("expected premove to preserve white clock, diff=%f", diff)
	}

	msg := readWireMessage(t, white.WriteChan)
	if msg.Type != MoveFromServerType.String() {
		t.Fatalf("expected premove broadcast, got %s", msg.Type)
	}

	if session.whoseMoveIsIt() != "black" {
		t.Fatalf("expected black to move after premove, got %s", session.whoseMoveIsIt())
	}
}

func TestHandlePremoveMessageSilentlyDiscardsInvalidPremove(t *testing.T) {
	withServerWorkingDir(t)

	hub := NewHub()
	white := newTestPlayer()
	black := newTestPlayer()

	game := newTestGame(t, "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b - - 0 1")
	session := &Session{
		SessionId: "session-1",
		Game:      game,
		White:     white,
		Black:     black,
	}

	white.SessionId = session.SessionId
	black.SessionId = session.SessionId
	white.Hub = hub
	black.Hub = hub
	white.Clock = Clock{
		TimeLeft:  10.5,
		TimeStamp: time.Now(),
	}
	black.Clock = Clock{
		TimeLeft:  10.5,
		TimeStamp: time.Now().Add(-2 * time.Second),
		IsRunning: true,
	}

	hub.InProgressSessions[session.SessionId] = session

	handleMoveMessage(
		Message{
			Payload: MoveToServer{
				Move: Move{
					From: "e7",
					To:   "e5",
				},
			},
		},
		session,
	)

	readWireMessage(t, white.WriteChan)

	whiteBefore := session.White.Clock.TimeLeft

	handlePremoveMessage(
		Message{
			Payload: PremoveToServer{
				Premove: Move{
					From: "a1",
					To:   "a3",
				},
			},
		},
		session,
	)

	if diff := math.Abs(session.White.Clock.TimeLeft - whiteBefore); diff > 0.0001 {
		t.Fatalf("expected invalid premove to leave white clock unchanged, diff=%f", diff)
	}

	select {
	case msg := <-white.WriteChan:
		t.Fatalf("expected no premove broadcast, got %s", string(msg))
	default:
	}

	if session.whoseMoveIsIt() != "white" {
		t.Fatalf("expected white to remain to move, got %s", session.whoseMoveIsIt())
	}
}

func newTestGame(t *testing.T, fenStr string) *chess.Game {
	t.Helper()

	fen, err := chess.FEN(fenStr)
	if err != nil {
		t.Fatal(err)
	}

	return chess.NewGame(fen, chess.UseNotation(chess.UCINotation{}))
}
