/*
 * CODEX-GENERATED: the contents of this file were fully constructed by a Codex agent and not a human.
*/

package game

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/notnil/chess"
)

type wireMessage struct {
	Type        string          `json:"type"`
	SessionId   string          `json:"sessionId"`
	PlayerColor string          `json:"playerColor"`
	Payload     json.RawMessage `json:"payload"`
}

func TestCreateNewLobbyStoresPendingRecord(t *testing.T) {
	hub := NewHub()
	player := newTestPlayer()

	createNewLobby(hub, player)

	if player.SessionId == "" {
		t.Fatal("expected session id to be assigned")
	}

	lobby, ok := hub.AwaitingOpponentSessions[player.SessionId]
	if !ok {
		t.Fatalf("expected pending lobby for session %s", player.SessionId)
	}

	if lobby.Player != player {
		t.Fatal("expected lobby to reference the creating player")
	}

	if lobby.CreatedAt.IsZero() {
		t.Fatal("expected lobby creation time to be set")
	}

	if lobby.Cancelled {
		t.Fatal("expected new lobby to be active")
	}

	if lobby.Expired {
		t.Fatal("expected new lobby to be unexpired")
	}
}

func TestOnDisconnectRemovesPendingLobbyAndClosesWriter(t *testing.T) {
	hub := NewHub()
	player := newTestPlayer()
	createNewLobby(hub, player)

	writer := player.WriteChan
	hub.onDisconnect(player, false)

	if _, ok := hub.AwaitingOpponentSessions[player.SessionId]; ok {
		t.Fatal("expected pending lobby to be removed on disconnect")
	}

	if player.WriteChan != nil {
		t.Fatal("expected player write channel to be cleared")
	}

	_, ok := <-writer
	if ok {
		t.Fatal("expected pending lobby writer to be closed")
	}
}

func TestExpirePendingLobbiesMarksLobbyExpiredBeforeFinalizing(t *testing.T) {
	hub := NewHub()
	player := newTestPlayer()
	createNewLobby(hub, player)

	lobby := hub.AwaitingOpponentSessions[player.SessionId]
	lobby.CreatedAt = time.Now().Add(-3 * time.Minute)

	hub.expirePendingLobbies()

	updatedLobby, ok := hub.AwaitingOpponentSessions[player.SessionId]
	if !ok {
		t.Fatal("expected expired lobby to remain available until finalization")
	}

	if !updatedLobby.Expired {
		t.Fatal("expected lobby to be marked expired")
	}

	if updatedLobby.Cancelled {
		t.Fatal("expected expiration to be distinct from cancellation")
	}
}

func TestExpirePendingLobbiesFinalizesExpiredLobbyOnSecondPass(t *testing.T) {
	hub := NewHub()
	player := newTestPlayer()
	createNewLobby(hub, player)

	lobby := hub.AwaitingOpponentSessions[player.SessionId]
	lobby.Expired = true
	lobby.ExpiredAt = time.Now().Add(-2 * time.Second)

	hub.expirePendingLobbies()

	if _, ok := hub.AwaitingOpponentSessions[player.SessionId]; ok {
		t.Fatal("expected expired lobby to be finalized and removed")
	}
}

func TestJoinPendingGamePromotesLobbyAndBroadcastsJoinedMessages(t *testing.T) {
	withServerWorkingDir(t)

	hub := NewHub()
	creator := newTestPlayerWithConn(t)
	joiner := newTestPlayer()

	createNewLobby(hub, creator)
	lobby := hub.AwaitingOpponentSessions[creator.SessionId]
	lobby.CreatedAt = time.Now().Add(-3 * time.Minute)
	hub.expirePendingLobbies()

	joinPendingGame(hub, joiner)

	if _, ok := hub.AwaitingOpponentSessions[creator.SessionId]; ok {
		t.Fatal("expected lobby to be removed once promoted")
	}

	session, ok := hub.InProgressSessions[creator.SessionId]
	if !ok {
		t.Fatalf("expected in-progress session for %s", creator.SessionId)
	}

	if session.Game == nil {
		t.Fatal("expected promoted session to have a chess game")
	}

	if session.White != creator && session.Black != creator {
		t.Fatal("expected creator to be part of the promoted session")
	}

	if session.White != joiner && session.Black != joiner {
		t.Fatal("expected joiner to be part of the promoted session")
	}

	assertJoinedMessage(t, creator.WriteChan, session.SessionId)
	assertJoinedMessage(t, joiner.WriteChan, session.SessionId)
}

func TestJoinPendingGameFallsBackToNewLobbyWhenPreviousLobbyWasCancelled(t *testing.T) {
	withServerWorkingDir(t)

	hub := NewHub()
	creator := newTestPlayerWithConn(t)
	joiner := newTestPlayer()

	createNewLobby(hub, creator)
	hub.onDisconnect(creator, false)

	joinPendingGame(hub, joiner)

	if len(hub.InProgressSessions) != 0 {
		t.Fatal("expected cancelled lobby not to promote into an in-progress game")
	}

	if len(hub.AwaitingOpponentSessions) != 1 {
		t.Fatalf("expected joiner to receive a fresh pending lobby, got %d", len(hub.AwaitingOpponentSessions))
	}

	var pending *PendingLobby
	for _, lobby := range hub.AwaitingOpponentSessions {
		pending = lobby
	}

	if pending.Player != joiner {
		t.Fatal("expected joiner to become the creator of the replacement lobby")
	}
}

func TestJoinComputerGameCreatesImmediateSessionAndBroadcastsJoinedMessages(t *testing.T) {
	withServerWorkingDir(t)

	hub := NewHub()
	player := newTestPlayer()
	computer := newTestPlayer()
	player.Hub = hub
	computer.Hub = hub

	joinComputerGame(player, computer)

	if len(hub.InProgressSessions) != 1 {
		t.Fatalf("expected one in-progress session, got %d", len(hub.InProgressSessions))
	}

	var session *Session
	for _, current := range hub.InProgressSessions {
		session = current
	}

	if session == nil {
		t.Fatal("expected session to be created")
	}

	if session.White != player && session.Black != player {
		t.Fatal("expected player to participate in the computer session")
	}

	if session.White != computer && session.Black != computer {
		t.Fatal("expected computer player to participate in the session")
	}

	assertJoinedMessage(t, player.WriteChan, session.SessionId)
	assertJoinedMessage(t, computer.WriteChan, session.SessionId)

	if player.SessionId != session.SessionId {
		t.Fatal("expected player session id to be assigned")
	}

	if computer.SessionId != session.SessionId {
		t.Fatal("expected computer session id to be assigned")
	}
}

func TestOnDisconnectAbandonedActiveSessionBroadcastsAbandonment(t *testing.T) {
	hub := NewHub()
	white := newTestPlayer()
	black := newTestPlayer()
	game := chess.NewGame()
	sessionID := "session-1"

	session := &Session{
		SessionId: sessionID,
		Game:      game,
		White:     white,
		Black:     black,
	}
	white.SessionId = sessionID
	black.SessionId = sessionID
	white.Hub = hub
	black.Hub = hub
	hub.InProgressSessions[sessionID] = session

	hub.onDisconnect(white, true)

	if _, ok := hub.InProgressSessions[sessionID]; ok {
		t.Fatal("expected active session to be removed after abandonment")
	}

	assertAbandonedMessage(t, black.WriteChan)
}

func TestJoinPendingGamePromotesExpiredLobbyBeforeFinalization(t *testing.T) {
	withServerWorkingDir(t)

	hub := NewHub()
	creator := newTestPlayerWithConn(t)
	joiner := newTestPlayer()

	createNewLobby(hub, creator)
	lobby := hub.AwaitingOpponentSessions[creator.SessionId]
	lobby.CreatedAt = time.Now().Add(-3 * time.Minute)
	hub.expirePendingLobbies()

	joinPendingGame(hub, joiner)

	if _, ok := hub.InProgressSessions[creator.SessionId]; !ok {
		t.Fatal("expected expired-but-not-finalized lobby to still be joinable")
	}
}

func newTestPlayer() *Player {
	return &Player{
		WriteChan: make(chan []byte, 4),
		Hub:       NewHub(),
	}
}

func newTestPlayerWithConn(t *testing.T) *Player {
	t.Helper()

	return &Player{
		WriteChan: make(chan []byte, 4),
		Hub:       NewHub(),
		Connection: newTestWebsocketConn(t),
	}
}

func assertJoinedMessage(t *testing.T, ch chan []byte, expectedSessionID string) {
	t.Helper()

	msg := readWireMessage(t, ch)
	if msg.Type != GameJoinedFromServerType.String() {
		t.Fatalf("expected joined message, got %s", msg.Type)
	}

	if msg.SessionId != expectedSessionID {
		t.Fatalf("expected session id %s, got %s", expectedSessionID, msg.SessionId)
	}
}

func assertAbandonedMessage(t *testing.T, ch chan []byte) {
	t.Helper()

	msg := readWireMessage(t, ch)
	if msg.Type != AbandonedFromServerType.String() {
		t.Fatalf("expected abandonment message, got %s", msg.Type)
	}
}

func readWireMessage(t *testing.T, ch chan []byte) wireMessage {
	t.Helper()

	select {
	case payload, ok := <-ch:
		if !ok {
			t.Fatal("expected message but channel was closed")
		}

		var msg wireMessage
		if err := json.Unmarshal(payload, &msg); err != nil {
			t.Fatalf("failed to decode wire message: %v", err)
		}
		return msg
	case <-time.After(2 * time.Second):
		t.Fatal("timed out waiting for wire message")
	}

	return wireMessage{}
}

func withServerWorkingDir(t *testing.T) {
	t.Helper()

	if _, err := os.Stat("pgns"); err == nil {
		return
	}

	cwd, err := os.Getwd()
	if err != nil {
		t.Fatalf("failed to read working dir: %v", err)
	}

	candidates := []string{
		filepath.Clean(filepath.Join(cwd, "..")),
		filepath.Clean(filepath.Join(cwd, "..", "..")),
	}

	for _, candidate := range candidates {
		if _, err := os.Stat(filepath.Join(candidate, "pgns")); err != nil {
			continue
		}

		original := cwd
		if err := os.Chdir(candidate); err != nil {
			t.Fatalf("failed to change working dir to %s: %v", candidate, err)
		}
		t.Cleanup(func() {
			_ = os.Chdir(original)
		})
		return
	}

	t.Fatalf("could not find pgns directory from %s", cwd)
}

func newTestWebsocketConn(t *testing.T) *websocket.Conn {
	t.Helper()

	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}

	serverConnCh := make(chan *websocket.Conn, 1)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("failed to upgrade websocket: %v", err)
		}
		serverConnCh <- conn
	}))
	t.Cleanup(server.Close)

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	clientConn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("failed to dial websocket server: %v", err)
	}
	t.Cleanup(func() {
		_ = clientConn.Close()
	})

	var serverConn *websocket.Conn
	select {
	case serverConn = <-serverConnCh:
	case <-time.After(2 * time.Second):
		t.Fatal("timed out waiting for websocket server connection")
	}

	t.Cleanup(func() {
		_ = serverConn.Close()
	})

	return serverConn
}
