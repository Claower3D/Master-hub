package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

// CallbackRequest represents the incoming callback form data
type CallbackRequest struct {
	Name    string `json:"name"`
	Phone   string `json:"phone"`
	Service string `json:"service"`
	City    string `json:"city"`
}

// CallbackResponse represents the API response for callback submission
type CallbackResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

// StatItem represents a company statistic
type StatItem struct {
	Num   string `json:"num"`
	Label string `json:"label"`
}

// ReviewItem represents a client review
type ReviewItem struct {
	Text   string `json:"text"`
	Author string `json:"author"`
}

// ServiceCategory represents a service category in the catalog
type ServiceCategory struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Icon  string `json:"icon"`
}

// In-memory storage for submitted callbacks
var (
	callbacks []CallbackRequest
	mu        sync.Mutex
)

func main() {
	mux := http.NewServeMux()

	// Health check endpoint
	mux.HandleFunc("/api/health", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok", "time": time.Now().Format(time.RFC3339)})
	}))

	// Stats endpoint
	mux.HandleFunc("/api/stats", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		stats := []StatItem{
			{Num: "50 000+", Label: "выполненных заказов"},
			{Num: "100+", Label: "видов услуг"},
			{Num: "4.9★", Label: "средняя оценка"},
			{Num: "12 мес", Label: "гарантия"},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(stats)
	}))

	// Reviews endpoint
	mux.HandleFunc("/api/reviews", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		reviews := []ReviewItem{
			{Text: "«Заказали клининг после ремонта + вывоз мусора. Приехали через час, всё сделали за вечер. Цена не выросла ни на тенге».", Author: "— Алия, Бостандыкский р-н"},
			{Text: "«Сломалась стиралка вечером. Мастер был у нас в 9 утра, починил за 40 минут. Дали гарантию на год».", Author: "— Ержан, мкр Самал"},
			{Text: "«Перетяжка дивана — как новый. Забрали, через 4 дня привезли. Очень аккуратно».", Author: "— Динара, ЖК «Альпийский»"},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(reviews)
	}))

	// Services catalog endpoint
	mux.HandleFunc("/api/services", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		categories := []ServiceCategory{
			{ID: "remont-tehniki", Title: "Ремонт техники", Icon: "ri-home-gear-line"},
			{ID: "transport", Title: "Транспорт", Icon: "ri-roadster-line"},
			{ID: "bytovye-uslugi", Title: "Бытовые услуги", Icon: "ri-sparkling-line"},
			{ID: "specialist", Title: "Специалисты", Icon: "ri-user-star-line"},
			{ID: "stroitelstvo-i-remont", Title: "Строительство", Icon: "ri-building-line"},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(categories)
	}))

	// Callback form submission endpoint
	mux.HandleFunc("/api/callback", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req CallbackRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Bad request", http.StatusBadRequest)
			return
		}

		mu.Lock()
		callbacks = append(callbacks, req)
		mu.Unlock()

		log.Printf("Новая заявка: Имя: %s, Тел: %s, Услуга: %s, Город: %s\n", req.Name, req.Phone, req.Service, req.City)

		resp := CallbackResponse{
			Status:  "success",
			Message: "Заявка успешно принята! Оператор свяжется с вами в течение 15 минут.",
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))

	port := "8080"
	fmt.Printf("🚀 Go Backend server running on http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}

// corsMiddleware handles CORS headers for preflight and actual requests
func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}
