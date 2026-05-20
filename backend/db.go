package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

// User represents a registered account
type User struct {
	ID           int       `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	Phone        string    `json:"phone"`
	City         string    `json:"city"`
	Bonuses      int       `json:"bonuses"`
	PasswordHash string    `json:"password_hash,omitempty"`
	Role         string    `json:"role"` // "admin" or "customer"
	CreatedAt    time.Time `json:"created_at"`
}

// Session represents a logged-in user session
type Session struct {
	Token     string    `json:"token"`
	UserID    int       `json:"user_id"`
	ExpiresAt time.Time `json:"expires_at"`
}

// CallbackRecord extends CallbackRequest with DB fields
type CallbackRecord struct {
	ID        int       `json:"id"`
	UserID    *int      `json:"user_id"` // Pointer for nullable field
	Name      string    `json:"name"`
	Phone     string    `json:"phone"`
	Service   string    `json:"service"`
	City      string    `json:"city"`
	Status    string    `json:"status"` // "pending", "in_progress", "completed"
	CreatedAt time.Time `json:"created_at"`
}

// DB defines all database operations
type DB interface {
	CreateUser(name, email, phone, city, password string) (*User, error)
	GetUserByEmail(email string) (*User, error)
	GetUserByID(id int) (*User, error)
	CreateSession(userID int) (*Session, error)
	GetSession(token string) (*Session, error)
	DeleteSession(token string) error
	CreateCallback(req CallbackRequest, userID *int) (*CallbackRecord, error)
	GetCallbacks(userID int, phone string) ([]CallbackRecord, error)
	GetAllCallbacks() ([]CallbackRecord, error)
	UpdateCallbackStatus(id int, status string) error
	UpdateUser(id int, name, phone, city, password string) (*User, error)
	Close() error
}

// PostgresDB implements DB interface using PostgreSQL
type PostgresDB struct {
	db *sql.DB
}

func NewPostgresDB(connStr string) (*PostgresDB, error) {
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	// Test connection
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, err
	}

	// Run migrations
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			email VARCHAR(255) UNIQUE NOT NULL,
			phone VARCHAR(255) NOT NULL,
			city VARCHAR(255) NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			role VARCHAR(50) NOT NULL DEFAULT 'customer',
			bonuses INTEGER NOT NULL DEFAULT 0,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);

		ALTER TABLE users ADD COLUMN IF NOT EXISTS bonuses INTEGER NOT NULL DEFAULT 0;

		CREATE TABLE IF NOT EXISTS sessions (
			token VARCHAR(255) PRIMARY KEY,
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			expires_at TIMESTAMP WITH TIME ZONE NOT NULL
		);

		CREATE TABLE IF NOT EXISTS callbacks (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
			name VARCHAR(255) NOT NULL,
			phone VARCHAR(255) NOT NULL,
			service VARCHAR(255) NOT NULL,
			city VARCHAR(255) NOT NULL,
			status VARCHAR(50) NOT NULL DEFAULT 'pending',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);
	`)
	if err != nil {
		db.Close()
		return nil, fmt.Errorf("migration failed: %w", err)
	}

	return &PostgresDB{db: db}, nil
}

func (p *PostgresDB) CreateUser(name, email, phone, city, password string) (*User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	role := "customer"
	// Make first user or specific emails admin
	if email == "admin@masterhub.kz" || os.Getenv("INITIAL_ADMIN_EMAIL") == email {
		role = "admin"
	}

	var user User
	err = p.db.QueryRow(`
		INSERT INTO users (name, email, phone, city, password_hash, role, bonuses)
		VALUES ($1, $2, $3, $4, $5, $6, 0)
		RETURNING id, name, email, phone, city, role, bonuses, created_at
	`, name, email, phone, city, string(hash), role).Scan(
		&user.ID, &user.Name, &user.Email, &user.Phone, &user.City, &user.Role, &user.Bonuses, &user.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Link past callbacks with matching phone number
	_, _ = p.db.Exec(`
		UPDATE callbacks SET user_id = $1 WHERE phone = $2 AND user_id IS NULL
	`, user.ID, phone)

	return &user, nil
}

func (p *PostgresDB) GetUserByEmail(email string) (*User, error) {
	var user User
	err := p.db.QueryRow(`
		SELECT id, name, email, phone, city, password_hash, role, bonuses, created_at
		FROM users WHERE email = $1
	`, email).Scan(
		&user.ID, &user.Name, &user.Email, &user.Phone, &user.City, &user.PasswordHash, &user.Role, &user.Bonuses, &user.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, errors.New("user not found")
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (p *PostgresDB) GetUserByID(id int) (*User, error) {
	var user User
	err := p.db.QueryRow(`
		SELECT id, name, email, phone, city, password_hash, role, bonuses, created_at
		FROM users WHERE id = $1
	`, id).Scan(
		&user.ID, &user.Name, &user.Email, &user.Phone, &user.City, &user.PasswordHash, &user.Role, &user.Bonuses, &user.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, errors.New("user not found")
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (p *PostgresDB) UpdateUser(id int, name, phone, city, password string) (*User, error) {
	var err error
	var hash []byte
	if password != "" {
		hash, err = bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
	}

	var user User
	if password != "" {
		err = p.db.QueryRow(`
			UPDATE users 
			SET name = $1, phone = $2, city = $3, password_hash = $4
			WHERE id = $5
			RETURNING id, name, email, phone, city, role, bonuses, created_at
		`, name, phone, city, string(hash), id).Scan(
			&user.ID, &user.Name, &user.Email, &user.Phone, &user.City, &user.Role, &user.Bonuses, &user.CreatedAt,
		)
	} else {
		err = p.db.QueryRow(`
			UPDATE users 
			SET name = $1, phone = $2, city = $3
			WHERE id = $4
			RETURNING id, name, email, phone, city, role, bonuses, created_at
		`, name, phone, city, id).Scan(
			&user.ID, &user.Name, &user.Email, &user.Phone, &user.City, &user.Role, &user.Bonuses, &user.CreatedAt,
		)
	}

	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (p *PostgresDB) CreateSession(userID int) (*Session, error) {
	// Generate random token
	token := fmt.Sprintf("%x", time.Now().UnixNano()) + fmt.Sprintf("%x", userID)
	expiresAt := time.Now().Add(24 * 7 * time.Hour) // 7 days

	_, err := p.db.Exec(`
		INSERT INTO sessions (token, user_id, expires_at)
		VALUES ($1, $2, $3)
	`, token, userID, expiresAt)
	if err != nil {
		return nil, err
	}

	return &Session{Token: token, UserID: userID, ExpiresAt: expiresAt}, nil
}

func (p *PostgresDB) GetSession(token string) (*Session, error) {
	var sess Session
	err := p.db.QueryRow(`
		SELECT token, user_id, expires_at FROM sessions WHERE token = $1
	`, token).Scan(&sess.Token, &sess.UserID, &sess.ExpiresAt)
	if err == sql.ErrNoRows {
		return nil, errors.New("session not found")
	}
	if err != nil {
		return nil, err
	}

	if time.Now().After(sess.ExpiresAt) {
		p.DeleteSession(token)
		return nil, errors.New("session expired")
	}

	return &sess, nil
}

func (p *PostgresDB) DeleteSession(token string) error {
	_, err := p.db.Exec("DELETE FROM sessions WHERE token = $1", token)
	return err
}

func (p *PostgresDB) CreateCallback(req CallbackRequest, userID *int) (*CallbackRecord, error) {
	var record CallbackRecord
	status := "pending"

	err := p.db.QueryRow(`
		INSERT INTO callbacks (user_id, name, phone, service, city, status)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, user_id, name, phone, service, city, status, created_at
	`, userID, req.Name, req.Phone, req.Service, req.City, status).Scan(
		&record.ID, &record.UserID, &record.Name, &record.Phone, &record.Service, &record.City, &record.Status, &record.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &record, nil
}

func (p *PostgresDB) GetCallbacks(userID int, phone string) ([]CallbackRecord, error) {
	rows, err := p.db.Query(`
		SELECT id, user_id, name, phone, service, city, status, created_at
		FROM callbacks
		WHERE user_id = $1 OR phone = $2
		ORDER BY created_at DESC
	`, userID, phone)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []CallbackRecord
	for rows.Next() {
		var r CallbackRecord
		if err := rows.Scan(&r.ID, &r.UserID, &r.Name, &r.Phone, &r.Service, &r.City, &r.Status, &r.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, r)
	}
	return list, nil
}

func (p *PostgresDB) GetAllCallbacks() ([]CallbackRecord, error) {
	rows, err := p.db.Query(`
		SELECT id, user_id, name, phone, service, city, status, created_at
		FROM callbacks
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []CallbackRecord
	for rows.Next() {
		var r CallbackRecord
		if err := rows.Scan(&r.ID, &r.UserID, &r.Name, &r.Phone, &r.Service, &r.City, &r.Status, &r.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, r)
	}
	return list, nil
}

func (p *PostgresDB) UpdateCallbackStatus(id int, status string) error {
	_, err := p.db.Exec("UPDATE callbacks SET status = $1 WHERE id = $2", status, id)
	return err
}

func (p *PostgresDB) Close() error {
	return p.db.Close()
}

// JsonDB implements DB interface using a single JSON file
type JsonDB struct {
	filePath string
	mu       sync.Mutex
	Data     struct {
		Users     []User           `json:"users"`
		Sessions  []Session        `json:"sessions"`
		Callbacks []CallbackRecord `json:"callbacks"`
	}
}

func NewJsonDB(filePath string) (*JsonDB, error) {
	db := &JsonDB{filePath: filePath}
	err := db.load()
	if err != nil && !os.IsNotExist(err) {
		return nil, err
	}
	if os.IsNotExist(err) {
		db.Data.Users = []User{}
		db.Data.Sessions = []Session{}
		db.Data.Callbacks = []CallbackRecord{}
		err = db.save()
		if err != nil {
			return nil, err
		}
	}
	return db, nil
}

func (j *JsonDB) load() error {
	j.mu.Lock()
	defer j.mu.Unlock()
	file, err := os.ReadFile(j.filePath)
	if err != nil {
		return err
	}
	return json.Unmarshal(file, &j.Data)
}

func (j *JsonDB) save() error {
	j.mu.Lock()
	defer j.mu.Unlock()
	bytes, err := json.MarshalIndent(j.Data, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(j.filePath, bytes, 0644)
}

func (j *JsonDB) CreateUser(name, email, phone, city, password string) (*User, error) {
	j.load() // Load latest data

	// Check email uniqueness
	for _, u := range j.Data.Users {
		if u.Email == email {
			return nil, errors.New("user with this email already exists")
		}
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	role := "customer"
	if email == "admin@masterhub.kz" || len(j.Data.Users) == 0 {
		role = "admin" // make first registered user or admin@masterhub.kz an admin
	}

	userID := len(j.Data.Users) + 1
	user := User{
		ID:           userID,
		Name:         name,
		Email:        email,
		Phone:        phone,
		City:         city,
		PasswordHash: string(hash),
		Role:         role,
		CreatedAt:    time.Now(),
	}

	j.Data.Users = append(j.Data.Users, user)

	// Link past callbacks with matching phone number
	for idx, cb := range j.Data.Callbacks {
		if cb.Phone == phone && cb.UserID == nil {
			idVal := userID
			j.Data.Callbacks[idx].UserID = &idVal
		}
	}

	if err := j.save(); err != nil {
		return nil, err
	}

	return &user, nil
}

func (j *JsonDB) GetUserByEmail(email string) (*User, error) {
	j.load()
	for _, u := range j.Data.Users {
		if u.Email == email {
			return &u, nil
		}
	}
	return nil, errors.New("user not found")
}

func (j *JsonDB) GetUserByID(id int) (*User, error) {
	j.load()
	for _, u := range j.Data.Users {
		if u.ID == id {
			return &u, nil
		}
	}
	return nil, errors.New("user not found")
}

func (j *JsonDB) UpdateUser(id int, name, phone, city, password string) (*User, error) {
	j.load()
	for idx, u := range j.Data.Users {
		if u.ID == id {
			j.Data.Users[idx].Name = name
			j.Data.Users[idx].Phone = phone
			j.Data.Users[idx].City = city
			if password != "" {
				hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
				if err != nil {
					return nil, err
				}
				j.Data.Users[idx].PasswordHash = string(hash)
			}
			if err := j.save(); err != nil {
				return nil, err
			}
			updated := j.Data.Users[idx]
			return &updated, nil
		}
	}
	return nil, errors.New("user not found")
}

func (j *JsonDB) CreateSession(userID int) (*Session, error) {
	j.load()
	token := fmt.Sprintf("%x", time.Now().UnixNano()) + fmt.Sprintf("%x", userID)
	expiresAt := time.Now().Add(24 * 7 * time.Hour)

	sess := Session{
		Token:     token,
		UserID:    userID,
		ExpiresAt: expiresAt,
	}

	j.Data.Sessions = append(j.Data.Sessions, sess)
	if err := j.save(); err != nil {
		return nil, err
	}
	return &sess, nil
}

func (j *JsonDB) GetSession(token string) (*Session, error) {
	j.load()
	for idx, s := range j.Data.Sessions {
		if s.Token == token {
			if time.Now().After(s.ExpiresAt) {
				// Remove expired session
				j.Data.Sessions = append(j.Data.Sessions[:idx], j.Data.Sessions[idx+1:]...)
				j.save()
				return nil, errors.New("session expired")
			}
			return &s, nil
		}
	}
	return nil, errors.New("session not found")
}

func (j *JsonDB) DeleteSession(token string) error {
	j.load()
	for idx, s := range j.Data.Sessions {
		if s.Token == token {
			j.Data.Sessions = append(j.Data.Sessions[:idx], j.Data.Sessions[idx+1:]...)
			return j.save()
		}
	}
	return nil
}

func (j *JsonDB) CreateCallback(req CallbackRequest, userID *int) (*CallbackRecord, error) {
	j.load()
	id := len(j.Data.Callbacks) + 1
	record := CallbackRecord{
		ID:        id,
		UserID:    userID,
		Name:      req.Name,
		Phone:     req.Phone,
		Service:   req.Service,
		City:      req.City,
		Status:    "pending",
		CreatedAt: time.Now(),
	}

	j.Data.Callbacks = append(j.Data.Callbacks, record)
	if err := j.save(); err != nil {
		return nil, err
	}
	return &record, nil
}

func (j *JsonDB) GetCallbacks(userID int, phone string) ([]CallbackRecord, error) {
	j.load()
	var list []CallbackRecord
	// Return in reverse chronological order
	for i := len(j.Data.Callbacks) - 1; i >= 0; i-- {
		cb := j.Data.Callbacks[i]
		if (cb.UserID != nil && *cb.UserID == userID) || cb.Phone == phone {
			list = append(list, cb)
		}
	}
	return list, nil
}

func (j *JsonDB) GetAllCallbacks() ([]CallbackRecord, error) {
	j.load()
	var list []CallbackRecord
	for i := len(j.Data.Callbacks) - 1; i >= 0; i-- {
		list = append(list, j.Data.Callbacks[i])
	}
	return list, nil
}

func (j *JsonDB) UpdateCallbackStatus(id int, status string) error {
	j.load()
	for idx, cb := range j.Data.Callbacks {
		if cb.ID == id {
			j.Data.Callbacks[idx].Status = status
			return j.save()
		}
	}
	return errors.New("callback not found")
}

func (j *JsonDB) Close() error {
	return nil
}

// Helper function to initialize database connection
func InitDB() (DB, error) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		if os.Getenv("PGPASSWORD") != "" {
			dbURL = fmt.Sprintf("postgres://postgres:%s@localhost:5432/masterhub?sslmode=disable", os.Getenv("PGPASSWORD"))
		}
	}

	var db DB
	var err error
	if dbURL != "" {
		log.Println("🔌 Connecting to PostgreSQL database...")
		db, err = NewPostgresDB(dbURL)
		if err == nil {
			log.Println("✅ Connected to PostgreSQL successfully!")
		} else {
			log.Printf("⚠️ PostgreSQL connection failed: %v. Falling back to JSON storage.\n", err)
			db, err = NewJsonDB("masterhub_data.json")
		}
	} else {
		log.Println("📁 Using JSON local file storage (masterhub_data.json)...")
		db, err = NewJsonDB("masterhub_data.json")
	}

	if err != nil {
		return nil, err
	}

	// Seed default test admin account
	_, err = db.GetUserByEmail("admin@masterhub.kz")
	if err != nil {
		log.Println("👤 Seeding default admin account (admin@masterhub.kz)...")
		_, err = db.CreateUser("Administrator", "admin@masterhub.kz", "+77777777777", "almaty", "admin123")
		if err != nil {
			log.Printf("⚠️ Failed to seed admin account: %v\n", err)
		}
	}

	return db, nil
}
