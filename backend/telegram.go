package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"
	"regexp"
	"strings"
)

const tgAPIBase = "https://api.telegram.org/bot"

type tgMessage struct {
	MessageID int `json:"message_id"`
	From      struct {
		ID        int64  `json:"id"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Username  string `json:"username"`
	} `json:"from"`
	Chat struct {
		ID int64 `json:"id"`
	} `json:"chat"`
	Text           string     `json:"text"`
	ReplyToMessage *tgMessage `json:"reply_to_message"`
}

type tgUpdate struct {
	UpdateID int       `json:"update_id"`
	Message  tgMessage `json:"message"`
}

type tgUpdatesResponse struct {
	OK     bool       `json:"ok"`
	Result []tgUpdate `json:"result"`
}

func tgToken() string {
	if t := os.Getenv("TELEGRAM_BOT_TOKEN"); t != "" {
		return t
	}
	return "8837427955:AAH9tieG7RrxQKr2YJpNmglr58U1oJe9lOs"
}

func tgSendMessage(chatID int64, text string) {
	token := tgToken()
	url := fmt.Sprintf("%s%s/sendMessage", tgAPIBase, token)
	body, _ := json.Marshal(map[string]interface{}{
		"chat_id":    chatID,
		"text":       text,
		"parse_mode": "HTML",
	})
	resp, err := http.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		log.Printf("⚠️ Telegram send error: %v", err)
		return
	}
	resp.Body.Close()
}

// NotifyNewOrder sends a notification about a new order to all Telegram subscribers
func NotifyNewOrder(db DB, record *CallbackRecord) {
	subscribers, err := db.GetTelegramSubscribers()
	if err != nil || len(subscribers) == 0 {
		return
	}

	msg := fmt.Sprintf(
		"🌐 <b>МастерХаб — Новая заявка с сайта</b>\n"+
			"━━━━━━━━━━━━━━━━━━━━\n"+
			"🔔 <b>Заявка #%d</b>\n\n"+
			"👤 <b>Имя:</b> %s\n"+
			"📞 <b>Телефон:</b> %s\n"+
			"🛠 <b>Услуга:</b> %s\n"+
			"🏙 <b>Город:</b> %s\n"+
			"🕐 <b>Время:</b> %s\n"+
			"━━━━━━━━━━━━━━━━━━━━\n"+
			"🔗 <i>master-hub-production.up.railway.app</i>",
		record.ID,
		record.Name,
		record.Phone,
		record.Service,
		record.City,
		record.CreatedAt.Format("02.01.2006 15:04"),
	)

	for _, chatID := range subscribers {
		tgSendMessage(chatID, msg)
	}
}

// StartTelegramBot starts the bot polling loop in a goroutine
func StartTelegramBot(db DB) {
	token := tgToken()
	if token == "" {
		log.Println("⚠️ TELEGRAM_BOT_TOKEN not set, skipping bot")
		return
	}
	log.Println("🤖 Starting Telegram bot polling...")
	go func() {
		offset := 0
		for {
			updates, err := tgGetUpdates(token, offset)
			if err != nil {
				log.Printf("⚠️ Telegram polling error: %v", err)
				time.Sleep(5 * time.Second)
				continue
			}
			for _, upd := range updates {
				offset = upd.UpdateID + 1
				handleTgUpdate(db, upd)
			}
			if len(updates) == 0 {
				time.Sleep(1 * time.Second)
			}
		}
	}()
}

func tgGetUpdates(token string, offset int) ([]tgUpdate, error) {
	url := fmt.Sprintf("%s%s/getUpdates?timeout=30&offset=%d", tgAPIBase, token, offset)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	var result tgUpdatesResponse
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}
	if !result.OK {
		return nil, fmt.Errorf("telegram API returned not OK")
	}
	return result.Result, nil
}

func handleTgUpdate(db DB, upd tgUpdate) {
	if upd.Message.MessageID == 0 {
		return
	}

	chatID := upd.Message.Chat.ID
	text := upd.Message.Text
	firstName := upd.Message.From.FirstName

	// Обработка ответа '+' на уведомление о заявке
	if upd.Message.ReplyToMessage != nil && strings.TrimSpace(text) == "+" {
		re := regexp.MustCompile(`#(\d+)`)
		matches := re.FindStringSubmatch(upd.Message.ReplyToMessage.Text)
		if len(matches) > 1 {
			orderID := matches[1]
			tgSendMessage(chatID, fmt.Sprintf("✅ Оператор %s принял заявку #%s", firstName, orderID))
			return
		}
	}

	switch text {
	case "/start":
		name := firstName
		if name == "" {
			name = fmt.Sprintf("user_%d", chatID)
		}
		err := db.AddTelegramSubscriber(chatID, name)
		if err != nil {
			tgSendMessage(chatID, "❌ Ошибка подписки, попробуйте позже.")
			return
		}
		tgSendMessage(chatID, fmt.Sprintf(
			"✅ <b>Привет, %s!</b>\n\nВы подписаны на уведомления о новых заявках МастерХаб.\n\n"+
				"📋 Команды:\n/start — подписаться\n/stop — отписаться",
			name,
		))
	case "/stop":
		_ = db.RemoveTelegramSubscriber(chatID)
		tgSendMessage(chatID, "🔕 Вы отписались от уведомлений.\nЧтобы подписаться снова — отправьте /start")
	default:
		tgSendMessage(chatID, "📋 Команды:\n/start — подписаться на уведомления\n/stop — отписаться")
	}
}
