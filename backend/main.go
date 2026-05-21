package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// CallbackRequest represents the incoming callback form data
type CallbackRequest struct {
	Name    string `json:"name"`
	Phone   string `json:"phone"`
	Service string `json:"service"`
	City    string `json:"city"`
}

// APIUser represents a user profile safe to send in JSON responses to the frontend client
type APIUser struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	City      string    `json:"city"`
	Bonuses   int       `json:"bonuses"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

func ToAPIUser(u *User) APIUser {
	if u == nil {
		return APIUser{}
	}
	return APIUser{
		ID:        u.ID,
		Name:      u.Name,
		Email:     u.Email,
		Phone:     u.Phone,
		City:      u.City,
		Bonuses:   u.Bonuses,
		Role:      u.Role,
		CreatedAt: u.CreatedAt,
	}
}

// CallbackResponse represents the API response for callback submission
type CallbackResponse struct {
	Status  string          `json:"status"`
	Message string          `json:"message"`
	Record  *CallbackRecord `json:"record,omitempty"`
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

// Global database instance
var dbInstance DB

func main() {
	var err error
	dbInstance, err = InitDB()
	if err != nil {
		log.Fatalf("❌ Failed to initialize database: %v", err)
	}
	defer dbInstance.Close()

	// Start Telegram bot notifications
	StartTelegramBot(dbInstance)

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

	// Callback form submission endpoint (supports optional authentication)
	mux.HandleFunc("/api/callback", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req CallbackRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Bad request", http.StatusBadRequest)
			return
		}

		// Optional auth check
		var userID *int
		authHeader := r.Header.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			token := strings.TrimPrefix(authHeader, "Bearer ")
			sess, err := dbInstance.GetSession(token)
			if err == nil {
				userID = &sess.UserID
			}
		}

		record, err := dbInstance.CreateCallback(req, userID)
		if err != nil {
			log.Printf("Error saving callback: %v\n", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		log.Printf("Новая заявка: Имя: %s, Тел: %s, Услуга: %s, Город: %s (UserID: %v)\n", req.Name, req.Phone, req.Service, req.City, userID)

		// Send Telegram notification to all subscribers
		go NotifyNewOrder(dbInstance, record)

		resp := CallbackResponse{
			Status:  "success",
			Message: "Заявка успешно принята! Оператор свяжется с вами в течение 15 минут.",
			Record:  record,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))

	// ---- AUTH ENDPOINTS ----

	// POST /api/auth/register
	mux.HandleFunc("/api/auth/register", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var input struct {
			Name     string `json:"name"`
			Email    string `json:"email"`
			Phone    string `json:"phone"`
			City     string `json:"city"`
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			http.Error(w, "Bad request", http.StatusBadRequest)
			return
		}

		if input.Name == "" || input.Email == "" || input.Phone == "" || input.City == "" || len(input.Password) < 6 {
			http.Error(w, "Invalid inputs (password must be at least 6 characters)", http.StatusBadRequest)
			return
		}

		user, err := dbInstance.CreateUser(input.Name, input.Email, input.Phone, input.City, input.Password)
		if err != nil {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}

		sess, err := dbInstance.CreateSession(user.ID)
		if err != nil {
			http.Error(w, "Session creation failed", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"token": sess.Token,
			"user":  ToAPIUser(user),
		})
	}))

	// POST /api/auth/login
	mux.HandleFunc("/api/auth/login", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var input struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			http.Error(w, "Bad request", http.StatusBadRequest)
			return
		}

		user, err := dbInstance.GetUserByEmail(input.Email)
		if err != nil {
			http.Error(w, "Неверный email или пароль", http.StatusUnauthorized)
			return
		}

		err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password))
		if err != nil {
			http.Error(w, "Неверный email или пароль", http.StatusUnauthorized)
			return
		}

		sess, err := dbInstance.CreateSession(user.ID)
		if err != nil {
			http.Error(w, "Session creation failed", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"token": sess.Token,
			"user":  ToAPIUser(user),
		})
	}))

	// POST /api/auth/logout
	mux.HandleFunc("/api/auth/logout", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		authHeader := r.Header.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			token := strings.TrimPrefix(authHeader, "Bearer ")
			_ = dbInstance.DeleteSession(token)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "success"})
	}))

	// GET /api/auth/me
	mux.HandleFunc("/api/auth/me", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			return
		}
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		user, err := getAuthenticatedUser(r, dbInstance)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"user": ToAPIUser(user),
		})
	}))

	// PUT /api/auth/profile
	mux.HandleFunc("/api/auth/profile", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			return
		}
		if r.Method != http.MethodPut {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		user, err := getAuthenticatedUser(r, dbInstance)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		var input struct {
			Name     string `json:"name"`
			Phone    string `json:"phone"`
			City     string `json:"city"`
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			http.Error(w, "Bad request", http.StatusBadRequest)
			return
		}

		if input.Name == "" || input.Phone == "" || input.City == "" {
			http.Error(w, "Name, phone and city are required", http.StatusBadRequest)
			return
		}

		updatedUser, err := dbInstance.UpdateUser(user.ID, input.Name, input.Phone, input.City, input.Password)
		if err != nil {
			http.Error(w, "Failed to update profile: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": "success",
			"user":   ToAPIUser(updatedUser),
		})
	}))

	// ---- CALLBACK QUERY & STATUS ENDPOINTS ----

	// GET /api/callbacks (list callbacks for logged-in user or all if admin)
	mux.HandleFunc("/api/callbacks", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			return
		}
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		user, err := getAuthenticatedUser(r, dbInstance)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		var list []CallbackRecord
		if user.Role == "admin" {
			list, err = dbInstance.GetAllCallbacks()
		} else {
			list, err = dbInstance.GetCallbacks(user.ID, user.Phone)
		}

		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(list)
	}))

	// PUT /api/callbacks/status (admin only, update callback status)
	mux.HandleFunc("/api/callbacks/status", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			return
		}
		if r.Method != http.MethodPut {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		user, err := getAuthenticatedUser(r, dbInstance)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		if user.Role != "admin" {
			http.Error(w, "Forbidden (Admin only)", http.StatusForbidden)
			return
		}

		var input struct {
			ID     int    `json:"id"`
			Status string `json:"status"`
		}
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			http.Error(w, "Bad request", http.StatusBadRequest)
			return
		}

		if input.ID == 0 || input.Status == "" {
			http.Error(w, "Invalid callback ID or status", http.StatusBadRequest)
			return
		}

		err = dbInstance.UpdateCallbackStatus(input.ID, input.Status)
		if err != nil {
			http.Error(w, "Failed to update status", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "success"})
	}))

	// GET /api/reviews
	mux.HandleFunc("/api/reviews", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			return
		}
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		reviews, err := dbInstance.GetReviews()
		if err != nil {
			http.Error(w, "Failed to get reviews", http.StatusInternalServerError)
			return
		}

		// Fallback to default reviews if DB is empty
		if len(reviews) == 0 {
			reviews = []ReviewRecord{
				{ID: 1, Author: "— Алия, Бостандыкский р-н", Text: "«Заказали клининг после ремонта + вывоз мусора. Приехали через час, всё сделали за вечер. Цена не выросла ни на тенге».", Rating: 5, CreatedAt: time.Now()},
				{ID: 2, Author: "— Ержан, мкр Самал", Text: "«Сломалась стиралка вечером. Мастер был у нас в 9 утра, починил за 40 минут. Дали гарантию на год».", Rating: 5, CreatedAt: time.Now()},
				{ID: 3, Author: "— Динара, ЖК «Альпийский»", Text: "«Перетяжка дивана — как новый. Забрали, через 4 дня привезли. Очень аккуратно».", Rating: 5, CreatedAt: time.Now()},
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(reviews)
	}))

	// POST /api/reviews/new
	mux.HandleFunc("/api/reviews/new", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var userID *int
		var defaultAuthor = "Аноним"

		user, err := getAuthenticatedUser(r, dbInstance)
		if err == nil && user != nil {
			userID = &user.ID
			defaultAuthor = user.Name
		}

		var input struct {
			Author string `json:"author"`
			Text   string `json:"text"`
			Rating int    `json:"rating"`
		}
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			http.Error(w, "Bad request", http.StatusBadRequest)
			return
		}

		author := input.Author
		if author == "" {
			author = defaultAuthor
		}
		text := input.Text
		rating := input.Rating
		if rating < 1 || rating > 5 {
			rating = 5
		}

		if text == "" {
			http.Error(w, "Review text is required", http.StatusBadRequest)
			return
		}

		rev, err := dbInstance.CreateReview(author, text, rating, userID)
		if err != nil {
			http.Error(w, "Failed to create review", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(rev)
	}))

	// Serve Static Files from dist / root directory (needed for deployment)
	staticDir := "."
	if _, err := os.Stat("index.html"); os.IsNotExist(err) {
		if _, err := os.Stat("../index.html"); err == nil {
			staticDir = "../"
		}
	}

	fileServer := http.FileServer(http.Dir(staticDir))
	mux.Handle("/", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}
		fileServer.ServeHTTP(w, r)
	}))

	// Check environment PORT or fallback to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("🚀 MasterHub Go Backend server running on http://localhost:%s (serving from %s)\n", port, staticDir)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}

// Helper to authenticate request and get User
func getAuthenticatedUser(r *http.Request, db DB) (*User, error) {
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return nil, errors.New("unauthorized (missing token)")
	}
	token := strings.TrimPrefix(authHeader, "Bearer ")
	sess, err := db.GetSession(token)
	if err != nil {
		return nil, errors.New("unauthorized (invalid or expired session)")
	}
	user, err := db.GetUserByID(sess.UserID)
	if err != nil {
		return nil, errors.New("unauthorized (user not found)")
	}
	return user, nil
}

// corsMiddleware handles CORS headers for preflight and actual requests
func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

