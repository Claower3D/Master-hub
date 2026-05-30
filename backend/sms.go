// [ignoring loop detection]
package main

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/big"
	"net/http"
	"net/url"
	"os"
	"strings"
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

// ── Twilio sender ─────────────────────────────────────────────────────────────

func getTwilioPhoneNumber(sid, token string) string {
	apiURL := fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/IncomingPhoneNumbers.json?PageSize=1", sid)
	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return ""
	}
	req.SetBasicAuth(sid, token)
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return ""
	}
	defer resp.Body.Close()

	var res struct {
		IncomingPhoneNumbers []struct {
			PhoneNumber string `json:"phone_number"`
		} `json:"incoming_phone_numbers"`
	}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &res)
	if len(res.IncomingPhoneNumbers) > 0 {
		return res.IncomingPhoneNumbers[0].PhoneNumber
	}
	return ""
}

func sendTwilioSMS(phone, message string) error {
	accountSID := os.Getenv("TWILIO_ACCOUNT_SID")
	authToken := os.Getenv("TWILIO_AUTH_TOKEN")
	if accountSID == "" || authToken == "" {
		return fmt.Errorf("Twilio credentials missing. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables")
	}
	from := os.Getenv("TWILIO_FROM")
	if from == "" {
		from = getTwilioPhoneNumber(accountSID, authToken)
		if from == "" {
			from = "+15017122661" // fallback test number
		}
	}

	apiURL := fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", accountSID)
	data := url.Values{}
	data.Set("To", phone)
	data.Set("From", from)
	data.Set("Body", message)

	req, err := http.NewRequest("POST", apiURL, strings.NewReader(data.Encode()))
	if err != nil {
		return err
	}
	req.SetBasicAuth(accountSID, authToken)
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("twilio HTTP %d: %s", resp.StatusCode, string(body))
	}
	log.Printf("📱 Twilio SMS sent from %s to %s successfully.", from, phone)
	return nil
}

// ── SMSC.ru sender ────────────────────────────────────────────────────────────

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

func sendSmscRu(phone, message string) error {
	login := smscLogin()
	password := smscPassword()

	if login == "" || password == "" {
		log.Printf("📱 [SMS DEMO] To %s: %s", phone, message)
		return nil
	}

	params := url.Values{}
	params.Set("login", login)
	params.Set("psw", password)
	params.Set("phones", phone)
	params.Set("mes", message)
	params.Set("fmt", "3")
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
	if err := sendTwilioSMS(phone, msg); err != nil {
		log.Printf("⚠️ Twilio SMS send failed: %v, trying SMSC.ru as fallback...", err)
		if errFallback := sendSmscRu(phone, msg); errFallback != nil {
			log.Printf("⚠️ Fallback SMSC.ru also failed: %v", errFallback)
		}
	}
	return code, nil
}
