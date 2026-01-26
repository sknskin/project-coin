import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { sign } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { UpbitService } from '../upbit/upbit.service';

export interface UpbitAccount {
  currency: string;
  balance: string;
  locked: string;
  avg_buy_price: string;
  avg_buy_price_modified: boolean;
  unit_currency: string;
}

export interface Holding {
  currency: string;
  balance: number;
  avgBuyPrice: number;
  currentPrice: number;
  evalAmount: number;
  buyAmount: number;
  profitLoss: number;
  profitLossRate: number;
}

export interface Portfolio {
  totalBuyPrice: number;
  totalEvalPrice: number;
  profitLoss: number;
  profitLossRate: number;
  holdings: Holding[];
}

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);
  private readonly algorithm = 'aes-256-gcm';

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private upbitService: UpbitService,
  ) {}

  async connectUpbit(
    userId: string,
    accessKey: string,
    secretKey: string,
  ): Promise<{ success: boolean; isValid: boolean }> {
    // Validate keys by making a test request
    const isValid = await this.validateUpbitKeys(accessKey, secretKey);

    if (!isValid) {
      throw new BadRequestException('Invalid Upbit API keys');
    }

    // Encrypt and store keys
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!encryptionKey || encryptionKey.length < 32) {
      throw new Error('Invalid encryption key configuration');
    }

    const accessKeyEnc = this.encrypt(accessKey, encryptionKey);
    const secretKeyEnc = this.encrypt(secretKey, encryptionKey);

    await this.prisma.upbitCredential.upsert({
      where: { userId },
      update: {
        accessKeyEnc,
        secretKeyEnc,
        isValid: true,
        lastSyncAt: new Date(),
      },
      create: {
        userId,
        accessKeyEnc,
        secretKeyEnc,
        isValid: true,
        lastSyncAt: new Date(),
      },
    });

    return { success: true, isValid: true };
  }

  async disconnectUpbit(userId: string): Promise<void> {
    await this.prisma.upbitCredential.delete({
      where: { userId },
    });
  }

  async getPortfolio(userId: string): Promise<Portfolio> {
    const credential = await this.prisma.upbitCredential.findUnique({
      where: { userId },
    });

    if (!credential) {
      throw new BadRequestException('Upbit not connected');
    }

    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY')!;
    const accessKey = this.decrypt(credential.accessKeyEnc, encryptionKey);
    const secretKey = this.decrypt(credential.secretKeyEnc, encryptionKey);

    // Get account balances
    const accounts = await this.getUpbitAccounts(accessKey, secretKey);

    // Filter non-KRW holdings with balance > 0
    const holdingsData = accounts.filter(
      (a) => a.currency !== 'KRW' && parseFloat(a.balance) > 0,
    );

    if (holdingsData.length === 0) {
      return {
        totalBuyPrice: 0,
        totalEvalPrice: 0,
        profitLoss: 0,
        profitLossRate: 0,
        holdings: [],
      };
    }

    // Get current prices
    const markets = holdingsData.map((h) => `KRW-${h.currency}`);
    const tickers = await this.upbitService.getTicker(markets);
    const priceMap = new Map(tickers.map((t) => [t.market, t.trade_price]));

    // Calculate holdings
    const holdings: Holding[] = holdingsData.map((h) => {
      const market = `KRW-${h.currency}`;
      const balance = parseFloat(h.balance);
      const avgBuyPrice = parseFloat(h.avg_buy_price);
      const currentPrice = priceMap.get(market) || 0;
      const buyAmount = balance * avgBuyPrice;
      const evalAmount = balance * currentPrice;
      const profitLoss = evalAmount - buyAmount;
      const profitLossRate = buyAmount > 0 ? (profitLoss / buyAmount) * 100 : 0;

      return {
        currency: h.currency,
        balance,
        avgBuyPrice,
        currentPrice,
        evalAmount,
        buyAmount,
        profitLoss,
        profitLossRate,
      };
    });

    // Calculate totals
    const totalBuyPrice = holdings.reduce((sum, h) => sum + h.buyAmount, 0);
    const totalEvalPrice = holdings.reduce((sum, h) => sum + h.evalAmount, 0);
    const profitLoss = totalEvalPrice - totalBuyPrice;
    const profitLossRate =
      totalBuyPrice > 0 ? (profitLoss / totalBuyPrice) * 100 : 0;

    return {
      totalBuyPrice,
      totalEvalPrice,
      profitLoss,
      profitLossRate,
      holdings,
    };
  }

  async getUserHoldings(userId: string): Promise<{ currency: string }[]> {
    const credential = await this.prisma.upbitCredential.findUnique({
      where: { userId },
    });

    if (!credential) {
      return [];
    }

    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY')!;
    const accessKey = this.decrypt(credential.accessKeyEnc, encryptionKey);
    const secretKey = this.decrypt(credential.secretKeyEnc, encryptionKey);

    const accounts = await this.getUpbitAccounts(accessKey, secretKey);

    return accounts
      .filter((a) => a.currency !== 'KRW' && parseFloat(a.balance) > 0)
      .map((a) => ({ currency: a.currency }));
  }

  async isUpbitConnected(userId: string): Promise<boolean> {
    const credential = await this.prisma.upbitCredential.findUnique({
      where: { userId },
    });
    return !!credential && credential.isValid;
  }

  private async validateUpbitKeys(
    accessKey: string,
    secretKey: string,
  ): Promise<boolean> {
    try {
      await this.getUpbitAccounts(accessKey, secretKey);
      return true;
    } catch {
      return false;
    }
  }

  private async getUpbitAccounts(
    accessKey: string,
    secretKey: string,
  ): Promise<UpbitAccount[]> {
    const payload = {
      access_key: accessKey,
      nonce: uuidv4(),
    };

    const token = sign(payload, secretKey);

    const response = await fetch('https://api.upbit.com/v1/accounts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch accounts');
    }

    return response.json();
  }

  private encrypt(text: string, key: string): string {
    const iv = crypto.randomBytes(16);
    const keyBuffer = Buffer.from(key.slice(0, 32));
    const cipher = crypto.createCipheriv(this.algorithm, keyBuffer, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  private decrypt(encryptedData: string, key: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const keyBuffer = Buffer.from(key.slice(0, 32));

    const decipher = crypto.createDecipheriv(this.algorithm, keyBuffer, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
