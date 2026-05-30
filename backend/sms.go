package main

import (
	"crypto/rand"
	"fmt"
	"io"
	"log"
	"math/big"
	"net/http"
	"net/url"
	"os"
	"sync"
	"time"
)

// ── In-memory SMS code store ──────────────────────────────────────────────────

type smsEntry struct {
	Code      string
	Phone     string
	ExpiresAt time.Time
	Attempts  int
}

var (
	smsMu    sync.Mutex
	smsCodes = map[string]*smsEntry{} // key = phone (normalized)
)

// generateCode returns a random 4-digit numeric code.
func generateCode() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(9000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%04d", n.Int64()+1000), nil
}

// storeSmsCode saves a code for the phone and returns it.
func storeSmsCode(phone, code string) {
	smsMu.Lock()
	defer smsMu.Unlock()
	smsCodes[phone] = &smsEntry{
		Code:      code,
		Phone:     phone,
		ExpiresAt: time.Now().Add(10 * time.Minute),
		Attempts:  0,
	}
}

// verifySmsCodeStore checks the code, returns true on match, false otherwise.
// Cleans up the entry after 5 failed attempts or on success.
func verifySmsCodeStore(phone, code string) (bool, string) {
	smsMu.Lock()
	defer smsMu.Unlock()

	entry, ok := smsCodes[phone]
	if !ok {
		return false, "Код не найден. Запросите новый SMS-код."
	}
	if time.Now().After(entry.ExpiresAt) {
		delete(smsCodes, phone)
		return false, "Срок действия кода истёк. Запросите новый SMS-код."
	}
	entry.Attempts++
	if entry.Attempts > 5 {
		delete(smsCodes, phone)
		return false, "Превышено число попыток. Запросите новый SMS-код."
	}
	if entry.Code != code {
		return false, fmt.Sprintf("Неверный код. Попыток осталось: %d", 6-entry.Attempts)
	}
	// Match – remove entry
	delete(smsCodes, phone)
	return true, ""
}

// ── SMSC.ru sender ────────────────────────────────────────────────────────────

// smscLogin / smscPassword are read from env or fall back to empty (demo mode).
func smscLogin() string {
	if v := os.Getenv("SMSC_LOGIN"); v != "" {
		return v
	}
	return ""
}

func smscPassword() string {
	if v := os.Getenv("SMSC_PASSWORD"); v != "" {
		return v
	}
	return ""
}

// sendSmscRu sends an SMS via SMSC.ru REST API.
// Returns nil on success or when running in demo mode (no credentials).
func sendSmscRu(phone, message string) error {
	login := smscLogin()
	password := smscPassword()

	// Demo mode — just log
	if login == "" || password == "" {
		log.Printf("📱 [SMS DEMO] To %s: %s", phone, message)
		return nil
	}

	params := url.Values{}
	params.Set("login", login)
	params.Set("psw", password)
	params.Set("phones", phone)
	params.Set("mes", message)
	params.Set("fmt", "3") // JSON response
	params.Set("charset", "utf-8")
	params.Set("sender", "HubMaster")

	apiURL := "https://smsc.ru/sys/send.php?" + params.Encode()

	resp, err := http.Get(apiURL)
	if err != nil {
		return fmt.Errorf("smsc request failed: %w", err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	log.Printf("📱 SMSC.ru response for %s: %s", phone, string(body))
	return nil
}

// SendVerificationSMS generates a code, stores it, and sends it to phone.
func SendVerificationSMS(phone string) (string, error) {
	code, err := generateCode()
	if err != nil {
		return "", err
	}
	storeSmsCode(phone, code)

	msg := fmt.Sprintf("Ваш код для входа в HUB MASTER: %s. Действует 10 минут.", code)
	if err := sendSmscRu(phone, msg); err != nil {
		log.Printf("⚠️  SMS send warning: %v", err)
		// Don't return error — still usable in demo/dev mode
	}
	return code, nil
}
