-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nickname" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upbit_credentials" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_key_enc" TEXT NOT NULL,
    "secret_key_enc" TEXT NOT NULL,
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upbit_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlist" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "market_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "markets" (
    "id" TEXT NOT NULL,
    "market_code" TEXT NOT NULL,
    "korean_name" TEXT NOT NULL,
    "english_name" TEXT NOT NULL,
    "market_warning" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_balance" DECIMAL(20,8) NOT NULL,
    "total_buy_price" DECIMAL(20,8) NOT NULL,
    "total_eval_price" DECIMAL(20,8) NOT NULL,
    "profit_loss" DECIMAL(20,8) NOT NULL,
    "profit_loss_rate" DECIMAL(10,4) NOT NULL,
    "snapshot_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holding_snapshots" (
    "id" TEXT NOT NULL,
    "portfolio_snapshot_id" TEXT NOT NULL,
    "market_code" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "balance" DECIMAL(20,8) NOT NULL,
    "avg_buy_price" DECIMAL(20,8) NOT NULL,
    "current_price" DECIMAL(20,8) NOT NULL,
    "eval_amount" DECIMAL(20,8) NOT NULL,
    "profit_loss" DECIMAL(20,8) NOT NULL,
    "profit_loss_rate" DECIMAL(10,4) NOT NULL,

    CONSTRAINT "holding_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "upbit_credentials_user_id_key" ON "upbit_credentials"("user_id");

-- CreateIndex
CREATE INDEX "watchlist_user_id_idx" ON "watchlist"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "watchlist_user_id_market_code_key" ON "watchlist"("user_id", "market_code");

-- CreateIndex
CREATE UNIQUE INDEX "markets_market_code_key" ON "markets"("market_code");

-- CreateIndex
CREATE INDEX "portfolio_snapshots_user_id_snapshot_at_idx" ON "portfolio_snapshots"("user_id", "snapshot_at");

-- CreateIndex
CREATE INDEX "holding_snapshots_portfolio_snapshot_id_idx" ON "holding_snapshots"("portfolio_snapshot_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upbit_credentials" ADD CONSTRAINT "upbit_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holding_snapshots" ADD CONSTRAINT "holding_snapshots_portfolio_snapshot_id_fkey" FOREIGN KEY ("portfolio_snapshot_id") REFERENCES "portfolio_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
