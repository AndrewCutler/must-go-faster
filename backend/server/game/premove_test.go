/*
 * CODEX-GENERATED: the contents of this file were fully constructed by a Codex agent and not a human.
 */

package game

import (
	"encoding/json"
	"math"
	"testing"
	"time"

	"github.com/notnil/chess"
)

type premoveAckPayload struct {
	Accepted bool `json:"accepted"`
	Premove  Move `json:"premove"`
}

type moveBroadcastPayload struct {
	Accepted bool   `json:"accepted"`
	Move     Move   `json:"move"`
	WhosNext string `json:"whosNext"`
}

func withComputerMoveDelay(t *testing.T, delay time.Duration) {
	t.Helper()

	original := scheduleComputerMoveDelay
	scheduleComputerMoveDelay = func(float64) time.Duration {
		return delay
	}
	t.Cleanup(func() {
		scheduleComputerMoveDelay = original
	})
}

func TestHandlePremoveMessageCachesValidPremoveAndAcksAcceptance(t *testing.T) {
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
	white.Color = "white"
	black.Color = "black"
	black.IsComputer = true
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

	handlePremoveMessage(
		Message{
			PlayerColor: "white",
			Payload: PremoveToServer{
				Premove: Move{
					From: "g1",
					To:   "f3",
				},
			},
		},
		session,
	)

	msg := readWireMessage(t, white.WriteChan)
	if msg.Type != PremoveFromServerType.String() {
		t.Fatalf("expected premove acknowledgement, got %s", msg.Type)
	}

	var payload premoveAckPayload
	if err := json.Unmarshal(msg.Payload, &payload); err != nil {
		t.Fatalf("failed to decode premove payload: %v", err)
	}

	if !payload.Accepted {
		t.Fatal("expected premove to be accepted")
	}

	if payload.Premove.From != "g1" || payload.Premove.To != "f3" {
		t.Fatalf("expected premove echo to match, got %+v", payload.Premove)
	}

	if session.PendingPremove == nil {
		t.Fatal("expected premove to be cached on the server")
	}

	if session.PendingPremove.Color != "white" {
		t.Fatalf("expected premove color to be white, got %s", session.PendingPremove.Color)
	}

	if session.PendingPremove.Move.From != "g1" || session.PendingPremove.Move.To != "f3" {
		t.Fatalf("expected cached premove to match, got %+v", session.PendingPremove.Move)
	}

	if session.whoseMoveIsIt() != "black" {
		t.Fatalf("expected black to remain to move, got %s", session.whoseMoveIsIt())
	}
}

func TestHandlePremoveMessageRejectsIllegalPremove(t *testing.T) {
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
	white.Color = "white"
	black.Color = "black"
	white.Hub = hub
	black.Hub = hub
	hub.InProgressSessions[session.SessionId] = session

	handlePremoveMessage(
		Message{
			PlayerColor: "white",
			Payload: PremoveToServer{
				Premove: Move{
					From: "a1",
					To:   "a3",
				},
			},
		},
		session,
	)

	msg := readWireMessage(t, white.WriteChan)
	if msg.Type != PremoveFromServerType.String() {
		t.Fatalf("expected premove rejection, got %s", msg.Type)
	}

	var payload premoveAckPayload
	if err := json.Unmarshal(msg.Payload, &payload); err != nil {
		t.Fatalf("failed to decode premove payload: %v", err)
	}

	if payload.Accepted {
		t.Fatal("expected premove to be rejected")
	}

	if session.PendingPremove != nil {
		t.Fatal("expected rejected premove to remain uncached")
	}
}

func TestHandleMoveMessageExecutesCachedPremoveImmediatelyWithoutReducingQueuedClock(t *testing.T) {
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
	white.Color = "white"
	black.Color = "black"
	black.IsComputer = true
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

	handlePremoveMessage(
		Message{
			PlayerColor: "white",
			Payload: PremoveToServer{
				Premove: Move{
					From: "g1",
					To:   "f3",
				},
			},
		},
		session,
	)

	readWireMessage(t, white.WriteChan)
	whiteBefore := session.White.Clock.TimeLeft

	handleMoveMessage(
		Message{
			PlayerColor: "black",
			Payload: MoveToServer{
				Move: Move{
					From: "e7",
					To:   "e5",
				},
			},
		},
		session,
	)

	first := readWireMessage(t, white.WriteChan)
	second := readWireMessage(t, white.WriteChan)

	if first.Type != MoveFromServerType.String() {
		t.Fatalf("expected first broadcast move, got %s", first.Type)
	}
	if second.Type != MoveFromServerType.String() {
		t.Fatalf("expected second broadcast move, got %s", second.Type)
	}

	var firstPayload moveBroadcastPayload
	if err := json.Unmarshal(first.Payload, &firstPayload); err != nil {
		t.Fatalf("failed to decode first move payload: %v", err)
	}

	var secondPayload moveBroadcastPayload
	if err := json.Unmarshal(second.Payload, &secondPayload); err != nil {
		t.Fatalf("failed to decode second move payload: %v", err)
	}

	if !firstPayload.Accepted || !secondPayload.Accepted {
		t.Fatal("expected both broadcasts to be accepted moves")
	}

	if firstPayload.Move.From != "e7" || firstPayload.Move.To != "e5" {
		t.Fatalf("expected first move to be black's move, got %+v", firstPayload.Move)
	}

	if secondPayload.Move.From != "g1" || secondPayload.Move.To != "f3" {
		t.Fatalf("expected second move to be the cached premove, got %+v", secondPayload.Move)
	}

	if session.whoseMoveIsIt() != "black" {
		t.Fatalf("expected black to move again after the premove, got %s", session.whoseMoveIsIt())
	}

	if session.PendingPremove != nil {
		t.Fatal("expected cached premove to be cleared after execution")
	}

	if diff := math.Abs(session.White.Clock.TimeLeft - whiteBefore); diff > 0.0001 {
		t.Fatalf("expected queued premove not to change white clock, diff=%f", diff)
	}
}

func TestHandleMoveMessageSchedulesComputerReplyAfterHumanMove(t *testing.T) {
	withServerWorkingDir(t)
	withComputerMoveDelay(t, 10*time.Millisecond)

	hub := NewHub()
	white := newTestPlayer()
	black := newTestPlayer()

	game := newTestGame(t, "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1")
	session := &Session{
		SessionId: "session-1",
		Game:      game,
		White:     white,
		Black:     black,
	}

	white.SessionId = session.SessionId
	black.SessionId = session.SessionId
	white.Color = "white"
	black.Color = "black"
	black.IsComputer = true
	white.Hub = hub
	black.Hub = hub
	white.Clock = Clock{
		TimeLeft:  30,
		TimeStamp: time.Now(),
	}
	black.Clock = Clock{
		TimeLeft:  30,
		TimeStamp: time.Now(),
		IsRunning: false,
	}

	hub.InProgressSessions[session.SessionId] = session

	handleMoveMessage(
		Message{
			PlayerColor: "white",
			Payload: MoveToServer{
				Move: Move{
					From: "e2",
					To:   "e4",
				},
			},
		},
		session,
	)

	first := readWireMessage(t, white.WriteChan)
	if first.Type != MoveFromServerType.String() {
		t.Fatalf("expected human move broadcast, got %s", first.Type)
	}

	second := readWireMessage(t, white.WriteChan)
	if second.Type != MoveFromServerType.String() {
		t.Fatalf("expected computer reply broadcast, got %s", second.Type)
	}

	var payload moveBroadcastPayload
	if err := json.Unmarshal(second.Payload, &payload); err != nil {
		t.Fatalf("failed to decode computer move payload: %v", err)
	}

	if payload.WhosNext != "white" {
		t.Fatalf("expected computer move to hand turn back to white, got %s", payload.WhosNext)
	}

	if session.whoseMoveIsIt() != "white" {
		t.Fatalf("expected white to be next after computer reply, got %s", session.whoseMoveIsIt())
	}
}

func TestHandleMoveMessageSchedulesComputerReplyOnSubsequentHumanTurns(t *testing.T) {
	withServerWorkingDir(t)
	withComputerMoveDelay(t, 10*time.Millisecond)

	hub := NewHub()
	white := newTestPlayer()
	black := newTestPlayer()

	game := newTestGame(t, "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1")
	session := &Session{
		SessionId: "session-1",
		Game:      game,
		White:     white,
		Black:     black,
	}

	white.SessionId = session.SessionId
	black.SessionId = session.SessionId
	white.Color = "white"
	black.Color = "black"
	black.IsComputer = true
	white.Hub = hub
	black.Hub = hub
	white.Clock = Clock{
		TimeLeft:  30,
		TimeStamp: time.Now(),
	}
	black.Clock = Clock{
		TimeLeft:  30,
		TimeStamp: time.Now(),
		IsRunning: false,
	}

	hub.InProgressSessions[session.SessionId] = session

	handleMoveMessage(
		Message{
			PlayerColor: "white",
			Payload: MoveToServer{
				Move: Move{
					From: "e2",
					To:   "e4",
				},
			},
		},
		session,
	)

	readWireMessage(t, white.WriteChan)
	readWireMessage(t, white.WriteChan)

	handleMoveMessage(
		Message{
			PlayerColor: "white",
			Payload: MoveToServer{
				Move: Move{
					From: "g1",
					To:   "f3",
				},
			},
		},
		session,
	)

	third := readWireMessage(t, white.WriteChan)
	if third.Type != MoveFromServerType.String() {
		t.Fatalf("expected second human move broadcast, got %s", third.Type)
	}

	fourth := readWireMessage(t, white.WriteChan)
	if fourth.Type != MoveFromServerType.String() {
		t.Fatalf("expected second computer reply broadcast, got %s", fourth.Type)
	}

	var fourthPayload moveBroadcastPayload
	if err := json.Unmarshal(fourth.Payload, &fourthPayload); err != nil {
		t.Fatalf("failed to decode second computer move payload: %v", err)
	}

	if fourthPayload.WhosNext != "white" {
		t.Fatalf("expected second computer move to hand turn back to white, got %s", fourthPayload.WhosNext)
	}

	if session.whoseMoveIsIt() != "white" {
		t.Fatalf("expected white to be next after second computer reply, got %s", session.whoseMoveIsIt())
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
