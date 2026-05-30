# Trigger build: 2026-05-31
# Stage 1: Build Go backend
FROM golang:1.22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o masterhub-backend .

# Stage 2: Final image
FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app

# Copy Go binary
COPY --from=backend-builder /app/backend/masterhub-backend .

# Copy the main monolithic index.html (our actual frontend)
COPY index.html .

# Copy static image assets from repo root
COPY cat_blinds.png cat_child.png cat_electric.png cat_fridge.png ./
COPY cat_moskit.png cat_washing.png cat_win_make.png cat_win_repair.png ./
COPY hero_bg.png icons.svg favicon.svg why_bg.png ./
COPY slide_appliances.png slide_furniture.png slide_windows.png ./

# Copy character images
COPY char_appliance_master.png char_blinds.png char_electric_master.png ./
COPY char_fridge.png char_furniture_master.png char_mosquito.png ./
COPY char_safety.png char_washing.png char_welding_master.png char_window_master.png ./

# Copy SEO files
COPY robots.txt sitemap.xml ./

EXPOSE 8080

CMD ["./masterhub-backend"]
