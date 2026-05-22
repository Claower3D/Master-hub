# Trigger build: 2026-05-22
# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Go backend
FROM golang:1.25-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o masterhub-backend .

# Stage 3: Final image
FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app

# Copy Go binary
COPY --from=backend-builder /app/backend/masterhub-backend .

# Copy built React app (index.html + assets/)
COPY --from=frontend-builder /app/frontend/dist/ .

# Copy static image assets from repo root
COPY cat_blinds.png cat_child.png cat_electric.png cat_fridge.png ./
COPY cat_moskit.png cat_washing.png cat_win_make.png cat_win_repair.png ./
COPY hero_bg.png icons.svg favicon.svg why_bg.png ./
COPY slide_appliances.png slide_furniture.png slide_windows.png ./

EXPOSE 8080

CMD ["./masterhub-backend"]
